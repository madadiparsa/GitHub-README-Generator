# api/urls.py
from django.urls import path
from .views import (
    GitHubLogin,
    GenerateReadmeView,
    GitHubSyncView,
    ReadmeScoreView,
    GalleryListView,
    PublishReadmeView,
    ForkReadmeView,
    ViewReadmeView,
    GitHubPushView,
    PreviewCreateView,
    PreviewRetrieveView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/github/',  GitHubLogin.as_view(),       name='github_login'),

    # ── AI Generation ─────────────────────────────────────────────────────
    path('generate/',     GenerateReadmeView.as_view(), name='generate_readme'),

    # ── GitHub Integration ────────────────────────────────────────────────
    path('github/sync/',  GitHubSyncView.as_view(),    name='github_sync'),
    path('github/push/',  GitHubPushView.as_view(),    name='github_push'),

    # ── README Score ──────────────────────────────────────────────────────
    path('score/',        ReadmeScoreView.as_view(),   name='readme_score'),

    # ── Gallery ───────────────────────────────────────────────────────────
    path('gallery/',                  GalleryListView.as_view(),   name='gallery_list'),
    path('gallery/publish/',          PublishReadmeView.as_view(), name='gallery_publish'),
    path('gallery/<str:slug>/fork/',  ForkReadmeView.as_view(),    name='gallery_fork'),
    path('gallery/<str:slug>/view/',  ViewReadmeView.as_view(),    name='gallery_view'),

    # ── Shareable Preview ─────────────────────────────────────────────────
    path('preview/create/',           PreviewCreateView.as_view(),   name='preview_create'),
    path('preview/<str:slug>/',       PreviewRetrieveView.as_view(), name='preview_retrieve'),
]