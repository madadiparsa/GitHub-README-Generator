# core/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',    admin.site.urls),
    path('api/',      include('api.urls')),
    path('accounts/', include('allauth.urls')),

    # ✅ Fix: dj-rest-auth endpoints (login, logout, token refresh, user)
    path('api/auth/',         include('dj_rest_auth.urls')),

    # ✅ Fix: registration endpoints (needed even for social-only auth
    #    because dj_rest_auth.registration wires up the social login adapter)
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
]