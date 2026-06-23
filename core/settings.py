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

# ✅ Fix: allow cookies to be sent cross-origin (needed for JWT cookie auth)
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
    )
}

REST_USE_JWT = True

REST_AUTH = {
    "USE_JWT":                True,
    "JWT_AUTH_COOKIE":        "my-app-auth",
    "JWT_AUTH_REFRESH_COOKIE": "my-refresh-token",
    # ✅ Fix: return tokens in response body as well as cookies so the
    #    frontend can store them in localStorage for the auth flow
    "JWT_AUTH_RETURN_EXPIRATION": True,
    "JWT_AUTH_HTTPONLY":      False,
}

# ✅ Fix: without this allauth defaults to mandatory e-mail verification,
#    which blocks GitHub OAuth users who have no verified e-mail address.
ACCOUNT_EMAIL_VERIFICATION       = "none"
ACCOUNT_EMAIL_REQUIRED            = False
ACCOUNT_AUTHENTICATION_METHOD     = "username"

SOCIALACCOUNT_EMAIL_REQUIRED      = False
SOCIALACCOUNT_EMAIL_VERIFICATION  = "none"
SOCIALACCOUNT_AUTO_SIGNUP         = True

# ✅ Fix: store the raw GitHub OAuth token on the SocialToken so the
#    navbar can use it to fetch the user's avatar / display name.
SOCIALACCOUNT_STORE_TOKENS        = True

ROOT_URLCONF = 'core.urls'

# ✅ Fix: was missing — Django won't serve WSGI without this
WSGI_APPLICATION = 'core.wsgi.application'

# ✅ Fix: was missing — suppresses Django system-check warning
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
STATIC_URL    = 'static/'