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
            return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)

        app = SocialApp.objects.get(provider="github")

        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={"client_id": app.client_id, "client_secret": app.secret, "code": code},
        )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return Response(token_data, status=400)
        request.data["access_token"] = access_token

        return super().post(request, *args, **kwargs)