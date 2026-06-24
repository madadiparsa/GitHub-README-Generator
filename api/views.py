# api/views.py
import requests
from django.conf import settings
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from groq import Groq
from .serializers import GenerateReadmeSerializer, GitHubSyncSerializer


# ---------------------------------------------------------------------------
# GitHub OAuth Login
# ---------------------------------------------------------------------------

class GitHubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter

    def post(self, request, *args, **kwargs):
        code = request.data.get("code")
        if not code:
            return Response(
                {"error": "No code provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            app = SocialApp.objects.get(provider="github")
        except SocialApp.DoesNotExist:
            return Response(
                {"error": "GitHub OAuth app is not configured in the admin panel."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id":     app.client_id,
                "client_secret": app.secret,
                "code":          code,
            },
            timeout=10,
        )

        token_data   = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return Response(
                {"error": "Failed to obtain access token from GitHub.", "detail": token_data},
                status=status.HTTP_400_BAD_REQUEST
            )

        mutable_data                 = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        mutable_data["access_token"] = access_token
        request._full_data           = mutable_data

        return super().post(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# AI README Generation
# ---------------------------------------------------------------------------

def build_prompt(data):
    name             = data.get('name', '')
    subtitle         = data.get('subtitle', '')
    description      = data.get('description', '')
    bio              = data.get('bio', '')
    current_learning = data.get('currentLearning', '')
    github_username  = data.get('githubUsername', '')
    skills           = data.get('skills', [])
    projects         = data.get('projects', [])
    social_links     = data.get('socialLinks', {})
    template         = data.get('template', 'modern')
    user_prompt      = data.get('prompt', '')

    projects_text = ''
    if projects:
        projects_text = '\n'.join([
            f"  - {p.get('name', '')}: {p.get('description', '')} "
            f"(Tech: {p.get('tech', '')}, URL: {p.get('url', '')})"
            for p in projects if p.get('name')
        ])

    social_text = ''
    if social_links:
        social_text = ', '.join([
            f"{k}: {v}" for k, v in social_links.items() if v and v.strip()
        ])

    skills_text = ', '.join(skills) if skills else ''

    template_guidance = {
        'modern': (
            "Use a modern style with centered HTML headings, shields.io badge-style "
            "skill indicators, a GitHub stats card embed, and horizontal dividers. "
            "Use emoji section headers."
        ),
        'minimalist': (
            "Use a clean minimalist style with plain markdown only — no HTML, no badges, "
            "no images. Use simple headings, bullet points, and inline code for skills. "
            "Keep it concise and elegant."
        ),
        'creative': (
            "Use a creative style with a capsule-render wave banner at the top, "
            "a typing SVG subtitle, colorful shields.io badges, a GitHub streak stats card, "
            "and a wave footer. Use emoji section headers and center-align content with HTML."
        ),
    }.get(template, '')

    prompt = f"""You are an expert GitHub profile README writer. Generate a complete,
professional, and engaging GitHub profile README in Markdown format.

## User Information
- Name: {name or 'Not provided'}
- Subtitle/Tagline: {subtitle or 'Not provided'}
- About/Description: {description or 'Not provided'}
- Currently working on: {bio or 'Not provided'}
- Currently learning: {current_learning or 'Not provided'}
- GitHub Username: {github_username or 'Not provided'}
- Skills/Tech Stack: {skills_text or 'Not provided'}

## Projects
{projects_text or 'No projects provided'}

## Social Links
{social_text or 'No social links provided'}

## Template Style
{template_guidance}

## Additional Instructions from User
{user_prompt or 'None'}

## Output Rules
- Output ONLY the raw Markdown content — no explanations, no preamble, no code fences
- Do NOT wrap the output in ```markdown or ``` blocks
- Make it feel personal, authentic, and human — not generic or robotic
- Include all provided information naturally
- If GitHub username is provided, embed a GitHub stats card:
  ![Stats](https://github-readme-stats.vercel.app/api?username={github_username}&show_icons=true&theme=radical)
- Make sections flow naturally based on the template style
- Use the user's actual name, skills, and projects — do not invent information
- If a field is "Not provided", skip that section gracefully
"""
    return prompt


class GenerateReadmeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GenerateReadmeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        prompt = build_prompt(data)

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)

            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert GitHub profile README writer. "
                            "You output only raw Markdown — never explanations, "
                            "never code fences, never preamble. "
                            "Every README you write is polished, personal, and professional."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2048,
            )

            generated_markdown = chat_completion.choices[0].message.content

            if generated_markdown.startswith("```"):
                lines = generated_markdown.split('\n')
                lines = [l for l in lines if not l.strip().startswith("```")]
                generated_markdown = '\n'.join(lines)

            return Response(
                {"markdown": generated_markdown},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": "AI generation failed.", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ---------------------------------------------------------------------------
# GitHub Sync
# ---------------------------------------------------------------------------

class GitHubSyncView(APIView):
    """
    POST /api/github/sync/
    Accepts a GitHub OAuth access token, calls the GitHub API,
    and returns the user's profile data, top repos, and detected
    languages so the Editor can auto-populate skills and projects.
    No Django auth required — the GitHub token IS the credential.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GitHubSyncSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        access_token = serializer.validated_data['access_token']
        headers      = {
            "Authorization": f"Bearer {access_token}",
            "Accept":        "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        # ── 1. Fetch the authenticated user's profile ─────────────────────
        try:
            user_resp = requests.get(
                "https://api.github.com/user",
                headers=headers,
                timeout=10,
            )
            user_resp.raise_for_status()
            github_user = user_resp.json()
        except requests.RequestException as e:
            return Response(
                {"error": "Failed to fetch GitHub user profile.", "detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # ── 2. Fetch the user's public repos (up to 100, sorted by stars) ─
        try:
            repos_resp = requests.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={
                    "sort":      "pushed",
                    "direction": "desc",
                    "per_page":  100,
                    "type":      "owner",
                },
                timeout=10,
            )
            repos_resp.raise_for_status()
            all_repos = repos_resp.json()
        except requests.RequestException as e:
            return Response(
                {"error": "Failed to fetch GitHub repositories.", "detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # ── 3. Extract top repos (non-fork, sorted by stars, top 6) ───────
        non_fork_repos = [r for r in all_repos if not r.get('fork', False)]
        top_repos      = sorted(
            non_fork_repos,
            key=lambda r: r.get('stargazers_count', 0),
            reverse=True
        )[:6]

        projects = [
            {
                "name":        repo['name'],
                "description": repo.get('description') or '',
                "url":         repo.get('html_url', ''),
                "tech":        repo.get('language') or '',
                "stars":       repo.get('stargazers_count', 0),
            }
            for repo in top_repos
        ]

        # ── 4. Detect languages across all repos ──────────────────────────
        language_counts = {}
        for repo in all_repos:
            lang = repo.get('language')
            if lang:
                language_counts[lang] = language_counts.get(lang, 0) + 1

        # Sort by frequency and return top 10
        detected_languages = sorted(
            language_counts.keys(),
            key=lambda l: language_counts[l],
            reverse=True
        )[:10]

        # ── 5. Map detected languages to skill names in our skills list ───
        # GitHub uses slightly different names than our skills list,
        # so we normalise them here.
        LANGUAGE_MAP = {
            'JavaScript':   'JavaScript',
            'TypeScript':   'TypeScript',
            'Python':       'Python',
            'Java':         'Java',
            'Go':           'Go',
            'Rust':         'Rust',
            'PHP':          'PHP',
            'Ruby':         'Ruby on Rails',
            'C++':          'C++',
            'C#':           'C#',
            'CSS':          'CSS3',
            'HTML':         'HTML5',
            'Shell':        'Bash',
            'Dockerfile':   'Docker',
            'Kotlin':       'Java',
            'Swift':        'Swift',
            'Dart':         'Flutter',
        }

        suggested_skills = list(dict.fromkeys([
            LANGUAGE_MAP.get(lang, lang)
            for lang in detected_languages
            if LANGUAGE_MAP.get(lang, lang)
        ]))

        # ── 6. Build and return the sync payload ──────────────────────────
        return Response(
            {
                "profile": {
                    "name":             github_user.get('name') or '',
                    "login":            github_user.get('login') or '',
                    "bio":              github_user.get('bio') or '',
                    "avatar_url":       github_user.get('avatar_url') or '',
                    "public_repos":     github_user.get('public_repos', 0),
                    "followers":        github_user.get('followers', 0),
                    "following":        github_user.get('following', 0),
                    "blog":             github_user.get('blog') or '',
                    "twitter_username": github_user.get('twitter_username') or '',
                    "email":            github_user.get('email') or '',
                    "location":         github_user.get('location') or '',
                    "company":          github_user.get('company') or '',
                },
                "projects":          projects,
                "suggested_skills":  suggested_skills,
                "detected_languages": detected_languages,
                "repo_count":        len(all_repos),
            },
            status=status.HTTP_200_OK
        )