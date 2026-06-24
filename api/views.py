# api/views.py
import requests
from django.conf import settings
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from groq import Groq
from .serializers import GenerateReadmeSerializer


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

        # Exchange the one-time code for a GitHub access token
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

        # ✅ Fix: request.data is an immutable QueryDict after DRF parses it.
        # Copy it into a plain mutable dict and override request.data via the
        # private _full_data attribute so super().post() can read the token.
        mutable_data                 = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        mutable_data["access_token"] = access_token
        request._full_data           = mutable_data

        return super().post(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# AI README Generation
# ---------------------------------------------------------------------------

def build_prompt(data):
    """
    Builds a detailed prompt for the Groq LLM based on the
    form data submitted by the user.
    """
    name            = data.get('name', '')
    subtitle        = data.get('subtitle', '')
    description     = data.get('description', '')
    bio             = data.get('bio', '')
    current_learning = data.get('currentLearning', '')
    github_username = data.get('githubUsername', '')
    skills          = data.get('skills', [])
    projects        = data.get('projects', [])
    social_links    = data.get('socialLinks', {})
    template        = data.get('template', 'modern')
    user_prompt     = data.get('prompt', '')

    # Build projects description
    projects_text = ''
    if projects:
        projects_text = '\n'.join([
            f"  - {p.get('name', '')}: {p.get('description', '')} "
            f"(Tech: {p.get('tech', '')}, URL: {p.get('url', '')})"
            for p in projects if p.get('name')
        ])

    # Build social links description
    social_text = ''
    if social_links:
        social_text = ', '.join([
            f"{k}: {v}" for k, v in social_links.items() if v and v.strip()
        ])

    # Build skills description
    skills_text = ', '.join(skills) if skills else ''

    # Template style guidance
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
    """
    POST /api/generate/
    Accepts form data, calls Groq LLM, returns generated markdown.
    No authentication required — guests can use basic generation.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GenerateReadmeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        # Build the prompt
        prompt = build_prompt(data)

        # Call Groq API
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

            # Strip accidental code fences if the model adds them anyway
            if generated_markdown.startswith("```"):
                lines = generated_markdown.split('\n')
                # Remove first and last fence lines
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