# api/views.py
import requests
from django.conf import settings
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.response import Response
from rest_framework import status


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
        mutable_data            = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        mutable_data["access_token"] = access_token
        request._full_data      = mutable_data

        return super().post(request, *args, **kwargs)