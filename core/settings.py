# core/settings.py
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = os.environ.get('SECRET_KEY')

DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]

INSTALLED_APPS = [
    # ✅ Jazzmin must be first — before django.contrib.admin
    'jazzmin',

    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.github',
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # Local
    'api',
]

SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ✅ Allow cookies to be sent cross-origin (needed for JWT cookie auth)
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
    )
}

REST_USE_JWT = True

REST_AUTH = {
    "USE_JWT":                    True,
    "JWT_AUTH_COOKIE":            "my-app-auth",
    "JWT_AUTH_REFRESH_COOKIE":    "my-refresh-token",
    # ✅ Return tokens in response body as well as cookies so the
    #    frontend can store them in localStorage for the auth flow
    "JWT_AUTH_RETURN_EXPIRATION": True,
    "JWT_AUTH_HTTPONLY":          False,
}

# ✅ Without this allauth defaults to mandatory e-mail verification,
#    which blocks GitHub OAuth users who have no verified e-mail address.
ACCOUNT_EMAIL_VERIFICATION        = "none"
ACCOUNT_EMAIL_REQUIRED            = False
ACCOUNT_AUTHENTICATION_METHOD     = "username"

SOCIALACCOUNT_EMAIL_REQUIRED      = False
SOCIALACCOUNT_EMAIL_VERIFICATION  = "none"
SOCIALACCOUNT_AUTO_SIGNUP         = True

# ✅ Store the raw GitHub OAuth token on the SocialToken so the
#    navbar can use it to fetch the user's avatar / display name.
SOCIALACCOUNT_STORE_TOKENS        = True

ROOT_URLCONF = 'core.urls'

# ✅ Was missing — Django won't serve WSGI without this
WSGI_APPLICATION = 'core.wsgi.application'

# ✅ Was missing — suppresses Django system-check warning
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME':   BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

STATIC_URL       = 'static/'
STATIC_ROOT      = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []


# ---------------------------------------------------------------------------
# Jazzmin — Bootstrap 5 admin theme
# ---------------------------------------------------------------------------
JAZZMIN_SETTINGS = {
    "site_title":    "README Gen Admin",
    "site_header":   "README Generator",
    "site_brand":    "README Gen",
    "welcome_sign":  "Welcome to the README Generator Admin Panel",
    "copyright":     "README Generator",

    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Site", "url": "/",           "new_window": True},
        {"name": "API",  "url": "/api/",       "new_window": True},
    ],

    "order_with_respect_to": [
        "auth",
        "api",
        "socialaccount",
    ],

    "icons": {
        "auth":                        "fas fa-users-cog",
        "auth.user":                   "fas fa-user",
        "auth.Group":                  "fas fa-users",
        "api.UserProfile":             "fas fa-id-card",
        "api.ReadmeTemplate":          "fas fa-file-alt",
        "socialaccount.SocialAccount": "fab fa-github",
        "socialaccount.SocialToken":   "fas fa-key",
        "socialaccount.SocialApp":     "fas fa-plug",
    },

    "default_icon_parents":  "fas fa-folder",
    "default_icon_children": "fas fa-circle",

    "related_modal_active":        True,
    "custom_css":                  None,
    "custom_js":                   None,
    "use_google_fonts_cdn":        True,
    "show_ui_builder":             False,
    "changeform_format":           "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user":  "collapsible",
        "auth.group": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text":         False,
    "footer_small_text":         False,
    "body_small_text":           False,
    "brand_small_text":          False,
    "brand_colour":              "navbar-dark",
    "accent":                    "accent-primary",
    "navbar":                    "navbar-dark",
    "no_navbar_border":          True,
    "navbar_fixed":              True,
    "layout_boxed":              False,
    "footer_fixed":              False,
    "sidebar_fixed":             True,
    "sidebar":                   "sidebar-dark-primary",
    "sidebar_nav_small_text":    False,
    "sidebar_disable_expand":    False,
    "sidebar_nav_child_indent":  True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style":  False,
    "sidebar_nav_flat_style":    False,
    "theme":                     "default",
    "dark_mode_theme":           None,
    "button_classes": {
        "primary":   "btn-primary",
        "secondary": "btn-secondary",
        "info":      "btn-info",
        "warning":   "btn-warning",
        "danger":    "btn-danger",
        "success":   "btn-success",
    },
}