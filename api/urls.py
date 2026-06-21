from django.urls import path
from .views import GitHubLogin

urlpatterns = [
    path("auth/github/",GitHubLogin.as_view(),name="github_login"),
]