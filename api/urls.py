# api/urls.py
from django.urls import path
from .views import GitHubLogin, GenerateReadmeView

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/github/', GitHubLogin.as_view(), name='github_login'),

    # ── AI Generation ─────────────────────────────────────────────────────
    path('generate/', GenerateReadmeView.as_view(), name='generate_readme'),

    # ── GitHub Integration ────────────────────────────────────────────────
    # Part 5: POST /api/github/sync/
    # path('github/sync/', GitHubSyncView.as_view(), name='github_sync'),

    # Part 10: POST /api/github/push/
    # path('github/push/', GitHubPushView.as_view(), name='github_push'),

    # ── Gallery ───────────────────────────────────────────────────────────
    # Part 8: GET  /api/gallery/
    # path('gallery/', GalleryListView.as_view(), name='gallery_list'),

    # Part 8: POST /api/gallery/publish/
    # path('gallery/publish/', PublishReadmeView.as_view(), name='gallery_publish'),

    # ── README Score ──────────────────────────────────────────────────────
    # Part 7: POST /api/score/
    # path('score/', ReadmeScoreView.as_view(), name='readme_score'),

    # ── Shareable Preview ─────────────────────────────────────────────────
    # Part 12: POST /api/preview/create/
    # path('preview/create/', PreviewCreateView.as_view(), name='preview_create'),

    # Part 12: GET  /api/preview/<slug>/
    # path('preview/<str:slug>/', PreviewRetrieveView.as_view(), name='preview_retrieve'),
]