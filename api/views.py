# api/views.py
import requests
import base64
from django.conf import settings
from django.shortcuts import get_object_or_404
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from groq import Groq
from .models import ReadmeTemplate, UserProfile
from .serializers import (
    GenerateReadmeSerializer,
    GitHubSyncSerializer,
    ReadmeScoreSerializer,
    PublishReadmeSerializer,
    GalleryItemSerializer,
    GitHubPushSerializer,
)


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

        data   = serializer.validated_data
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
            "Authorization":        f"Bearer {access_token}",
            "Accept":               "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

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

        language_counts = {}
        for repo in all_repos:
            lang = repo.get('language')
            if lang:
                language_counts[lang] = language_counts.get(lang, 0) + 1

        detected_languages = sorted(
            language_counts.keys(),
            key=lambda l: language_counts[l],
            reverse=True
        )[:10]

        LANGUAGE_MAP = {
            'JavaScript': 'JavaScript',
            'TypeScript': 'TypeScript',
            'Python':     'Python',
            'Java':       'Java',
            'Go':         'Go',
            'Rust':       'Rust',
            'PHP':        'PHP',
            'Ruby':       'Ruby on Rails',
            'C++':        'C++',
            'C#':         'C#',
            'CSS':        'CSS3',
            'HTML':       'HTML5',
            'Shell':      'Bash',
            'Dockerfile': 'Docker',
            'Kotlin':     'Java',
            'Swift':      'Swift',
            'Dart':       'Flutter',
        }

        suggested_skills = list(dict.fromkeys([
            LANGUAGE_MAP.get(lang, lang)
            for lang in detected_languages
            if LANGUAGE_MAP.get(lang, lang)
        ]))

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
                "projects":           projects,
                "suggested_skills":   suggested_skills,
                "detected_languages": detected_languages,
                "repo_count":         len(all_repos),
            },
            status=status.HTTP_200_OK
        )


# ---------------------------------------------------------------------------
# README Score & Linter
# ---------------------------------------------------------------------------

SCORE_RULES = [
    {
        "id":         "has_name",
        "category":   "Essential",
        "points":     15,
        "label":      "Name added",
        "suggestion": "Add your name — it's the first thing visitors see.",
        "check":      lambda d: bool(d.get('name', '').strip()),
    },
    {
        "id":         "has_subtitle",
        "category":   "Essential",
        "points":     10,
        "label":      "Subtitle / tagline added",
        "suggestion": "Add a short tagline that describes what you do.",
        "check":      lambda d: bool(d.get('subtitle', '').strip()),
    },
    {
        "id":         "has_github_username",
        "category":   "Essential",
        "points":     15,
        "label":      "GitHub username set",
        "suggestion": "Set your GitHub username to enable stats cards and links.",
        "check":      lambda d: bool(d.get('githubUsername', '').strip()),
    },
    {
        "id":         "has_description",
        "category":   "Content",
        "points":     10,
        "label":      "Description written",
        "suggestion": "Write a short intro — 2–3 sentences about who you are.",
        "check":      lambda d: len(d.get('description', '').strip()) >= 20,
    },
    {
        "id":         "has_bio",
        "category":   "Content",
        "points":     5,
        "label":      "Currently working on filled in",
        "suggestion": "Tell visitors what you're currently building.",
        "check":      lambda d: bool(d.get('bio', '').strip()),
    },
    {
        "id":         "has_learning",
        "category":   "Content",
        "points":     5,
        "label":      "Currently learning filled in",
        "suggestion": "Share what you're learning — it shows curiosity and growth.",
        "check":      lambda d: bool(d.get('currentLearning', '').strip()),
    },
    {
        "id":         "has_skills",
        "category":   "Content",
        "points":     10,
        "label":      "Skills selected",
        "suggestion": "Select at least 3 skills from the Tech Stack section.",
        "check":      lambda d: len(d.get('skills', [])) >= 3,
    },
    {
        "id":         "has_projects",
        "category":   "Projects",
        "points":     10,
        "label":      "At least one project added",
        "suggestion": "Add at least one project — it's the best way to show your work.",
        "check":      lambda d: len([
            p for p in d.get('projects', []) if p.get('name', '').strip()
        ]) >= 1,
    },
    {
        "id":         "projects_have_urls",
        "category":   "Projects",
        "points":     5,
        "label":      "Projects have links",
        "suggestion": "Add GitHub or live URLs to your projects so visitors can explore them.",
        "check":      lambda d: all(
            p.get('url', '').strip()
            for p in d.get('projects', [])
            if p.get('name', '').strip()
        ) and len(d.get('projects', [])) > 0,
    },
    {
        "id":         "has_social_links",
        "category":   "Social",
        "points":     5,
        "label":      "At least one social link added",
        "suggestion": "Add at least one social link so people can connect with you.",
        "check":      lambda d: any(
            v.strip() for v in d.get('socialLinks', {}).values() if v
        ),
    },
    {
        "id":         "has_email_or_website",
        "category":   "Social",
        "points":     5,
        "label":      "Email or website added",
        "suggestion": "Add your email or website so recruiters and collaborators can reach you.",
        "check":      lambda d: bool(
            d.get('socialLinks', {}).get('email', '').strip() or
            d.get('socialLinks', {}).get('website', '').strip()
        ),
    },
    {
        "id":         "has_stats",
        "category":   "Polish",
        "points":     5,
        "label":      "GitHub stats card enabled",
        "suggestion": "Enable the GitHub stats card to show your contribution activity.",
        "check":      lambda d: bool(d.get('showStats')) and bool(d.get('githubUsername', '').strip()),
    },
]

TOTAL_POINTS = sum(r['points'] for r in SCORE_RULES)


def calculate_score(data):
    earned  = 0
    results = []

    for rule in SCORE_RULES:
        passed = rule['check'](data)
        if passed:
            earned += rule['points']
        results.append({
            "id":         rule['id'],
            "category":   rule['category'],
            "label":      rule['label'],
            "points":     rule['points'],
            "passed":     passed,
            "suggestion": None if passed else rule['suggestion'],
        })

    score = round((earned / TOTAL_POINTS) * 100)

    if score >= 90:
        grade, grade_color = 'A', '#10b981'
    elif score >= 75:
        grade, grade_color = 'B', '#06b6d4'
    elif score >= 60:
        grade, grade_color = 'C', '#f59e0b'
    elif score >= 40:
        grade, grade_color = 'D', '#f97316'
    else:
        grade, grade_color = 'F', '#ef4444'

    return {
        "score":       score,
        "earned":      earned,
        "total":       TOTAL_POINTS,
        "grade":       grade,
        "grade_color": grade_color,
        "results":     results,
        "suggestions": [r['suggestion'] for r in results if not r['passed']],
    }


class ReadmeScoreView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ReadmeScoreSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = calculate_score(serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Gallery — List
# ---------------------------------------------------------------------------

class GalleryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        from django.db.models import Q
        queryset = ReadmeTemplate.objects.filter(
            is_public=True
        ).select_related('created_by', 'created_by__profile')

        template_filter = request.query_params.get('template')
        if template_filter and template_filter in ['modern', 'minimalist', 'creative']:
            queryset = queryset.filter(template_id=template_filter)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(created_by__username__icontains=search)
            )

        queryset = queryset[:50]
        serializer = GalleryItemSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Gallery — Publish
# ---------------------------------------------------------------------------

class PublishReadmeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = PublishReadmeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        existing = ReadmeTemplate.objects.filter(
            created_by=request.user,
            is_public=True,
        ).first()

        if existing:
            existing.title       = data['title']
            existing.content     = data['content']
            existing.template_id = data.get('template', 'modern')
            existing.save()
            readme  = existing
            created = False
        else:
            readme = ReadmeTemplate.objects.create(
                title       = data['title'],
                content     = data['content'],
                template_id = data.get('template', 'modern'),
                created_by  = request.user,
                is_public   = True,
            )
            created = True

        return Response(
            {
                "id":      readme.id,
                "slug":    readme.slug,
                "title":   readme.title,
                "created": created,
                "message": "README published to gallery!" if created else "Gallery README updated!",
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


# ---------------------------------------------------------------------------
# Gallery — Fork
# ---------------------------------------------------------------------------

class ForkReadmeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug, *args, **kwargs):
        readme = get_object_or_404(ReadmeTemplate, slug=slug, is_public=True)
        readme.fork_count += 1
        readme.save(update_fields=['fork_count'])

        return Response(
            {
                "slug":       readme.slug,
                "title":      readme.title,
                "content":    readme.content,
                "template":   readme.template_id,
                "fork_count": readme.fork_count,
            },
            status=status.HTTP_200_OK
        )


# ---------------------------------------------------------------------------
# Gallery — View count
# ---------------------------------------------------------------------------

class ViewReadmeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug, *args, **kwargs):
        readme = get_object_or_404(ReadmeTemplate, slug=slug, is_public=True)
        readme.view_count += 1
        readme.save(update_fields=['view_count'])
        return Response({"ok": True}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# GitHub Push — commit README to user's profile repo
# ---------------------------------------------------------------------------

class GitHubPushView(APIView):
    """
    POST /api/github/push/
    Commits the generated README.md directly to the user's GitHub
    profile repository (<username>/<username>) using the GitHub
    Contents API.

    Flow:
      1. Use the access token to get the authenticated user's login
      2. Check if the profile repo exists — if not, create it
      3. Check if README.md already exists in the repo (need its SHA
         to update it)
      4. Create or update README.md via a PUT to the contents API
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GitHubPushSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        access_token   = serializer.validated_data['access_token']
        content        = serializer.validated_data['content']
        commit_message = serializer.validated_data.get(
            'commit_message',
            'Update README.md via README Generator'
        )

        headers = {
            "Authorization":        f"Bearer {access_token}",
            "Accept":               "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        # ── 1. Get the authenticated user's GitHub login ──────────────────
        try:
            user_resp = requests.get(
                "https://api.github.com/user",
                headers=headers,
                timeout=10,
            )
            user_resp.raise_for_status()
            github_user = user_resp.json()
            username    = github_user.get('login')

            if not username:
                return Response(
                    {"error": "Could not determine GitHub username from token."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except requests.RequestException as e:
            return Response(
                {"error": "Failed to fetch GitHub user.", "detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        profile_repo = username  # GitHub profile repo = <username>/<username>

        # ── 2. Check if the profile repo exists ───────────────────────────
        repo_resp = requests.get(
            f"https://api.github.com/repos/{username}/{profile_repo}",
            headers=headers,
            timeout=10,
        )

        if repo_resp.status_code == 404:
            # Create the profile repo
            create_resp = requests.post(
                "https://api.github.com/user/repos",
                headers=headers,
                json={
                    "name":        profile_repo,
                    "description": "My GitHub profile README",
                    "private":     False,
                    "auto_init":   True,
                },
                timeout=10,
            )
            if create_resp.status_code not in (200, 201):
                return Response(
                    {
                        "error": "Failed to create profile repository.",
                        "detail": create_resp.json(),
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )

        elif repo_resp.status_code != 200:
            return Response(
                {
                    "error": "Failed to check profile repository.",
                    "detail": repo_resp.json(),
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        # ── 3. Check if README.md already exists (need SHA to update) ─────
        existing_sha = None
        file_resp    = requests.get(
            f"https://api.github.com/repos/{username}/{profile_repo}/contents/README.md",
            headers=headers,
            timeout=10,
        )
        if file_resp.status_code == 200:
            existing_sha = file_resp.json().get('sha')

        # ── 4. Base64-encode the content and push ─────────────────────────
        encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')

        push_payload = {
            "message": commit_message,
            "content": encoded_content,
        }
        if existing_sha:
            push_payload["sha"] = existing_sha

        push_resp = requests.put(
            f"https://api.github.com/repos/{username}/{profile_repo}/contents/README.md",
            headers=headers,
            json=push_payload,
            timeout=15,
        )

        if push_resp.status_code not in (200, 201):
            return Response(
                {
                    "error":  "Failed to push README to GitHub.",
                    "detail": push_resp.json(),
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        push_data = push_resp.json()

        return Response(
            {
                "success":     True,
                "username":    username,
                "repo":        profile_repo,
                "commit_sha":  push_data.get('commit', {}).get('sha', ''),
                "commit_url":  push_data.get('commit', {}).get('html_url', ''),
                "profile_url": f"https://github.com/{username}",
                "readme_url":  f"https://github.com/{username}/{profile_repo}/blob/main/README.md",
                "message":     f"README.md {'updated' if existing_sha else 'created'} successfully!",
            },
            status=status.HTTP_200_OK
        )