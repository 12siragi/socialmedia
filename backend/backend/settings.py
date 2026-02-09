from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# ---------------------------
# BASE DIRECTORY
# ---------------------------
BASE_DIR = Path(__file__).resolve().parent.parent


# Load .env file
load_dotenv(BASE_DIR / ".env")

# ---------------------------
# SECRET KEY
# ---------------------------
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", 'django-insecure-v4s^@fluo*)a8u^m(a4l4$#%bzx&mvfm$oe$lc(6yn_intj(l%')

# ---------------------------
# DEBUG MODE
# ---------------------------
DEBUG = False  # Always False in production

# ---------------------------
# ALLOWED HOSTS
# ---------------------------
ALLOWED_HOSTS = [
    "pingchart.vercel.app",
    "socialmedia-6.onrender.com",
    ".onrender.com",
    "localhost",
    "127.0.0.1",
    'jamal-interrogational-mariah.ngrok-free.dev',
]

# ---------------------------
# APPLICATIONS
# ---------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'django_extensions',
    
    # ✅ Social Auth
    'social_django',
    
    # Your apps
    'accounts',
    'post',
    'comment',
]

#---------------------------
# TEMPLATES
#---------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                # ✅ Social Auth context processors
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]


# ---------------------------
# MIDDLEWARE
# ---------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.gzip.GZipMiddleware',  
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',  # ✅ Required
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # ✅ Required
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ---------------------------
# URLS & WSGI
# ---------------------------
ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'

# ---------------------------
# DATABASE
# ---------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME"),
        "USER": os.environ.get("DB_USER"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST"),
        "PORT": os.environ.get("DB_PORT"),
        "CONN_MAX_AGE": 600,  # ✅ Reuse connections for 10 minutes
        "OPTIONS": {
            "connect_timeout": 10,
        }   
    }
}



# ---------------------------
# PASSWORD VALIDATORS
# ---------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
# ---------------------------
# INTERNATIONALIZATION
# ---------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# ---------------------------
# STATIC FILES
# ---------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ---------------------------
# MEDIA FILES
# ---------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'uploads'

# ---------------------------
# CUSTOM USER MODEL
# ---------------------------
AUTH_USER_MODEL = "accounts.CustomUser"

# ---------------------------
# REST FRAMEWORK
# ---------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
# ---------------------------
# SIMPLE JWT
# ---------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,

    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,

    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",

    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",

    "JTI_CLAIM": "jti",

    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),

    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
    "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
    "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
}

# ---------------------------
# REDIS CACHE
# ---------------------------
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://redis:6379/1",  # docker service name + port
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
# ---------------------------
# SESSION SETTINGS (Add this section)
# ---------------------------
# backend/settings.py

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_SAVE_EVERY_REQUEST = True

# Critical settings:
SESSION_COOKIE_SECURE = False  # Set False for development/ngrok
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = None  # Changed from 'Lax' to None
SESSION_COOKIE_DOMAIN = None    # Let Django auto-detect


# ---------------------------
AUTHENTICATION_BACKENDS = (
    # Social Auth Backends
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.github.GithubOAuth2',
    'social_core.backends.facebook.FacebookOAuth2',
    
    # Default Django backend (email/password)
    'django.contrib.auth.backends.ModelBackend',
)

# ---------------------------
# PYTHON SOCIAL AUTH SETTINGS
# ---------------------------

# OAuth Keys (from .env)
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')

SOCIAL_AUTH_GITHUB_KEY = os.environ.get('GITHUB_OAUTH_CLIENT_ID')
SOCIAL_AUTH_GITHUB_SECRET = os.environ.get('GITHUB_OAUTH_CLIENT_SECRET')

SOCIAL_AUTH_FACEBOOK_KEY = os.environ.get('FACEBOOK_OAUTH_CLIENT_ID')
SOCIAL_AUTH_FACEBOOK_SECRET = os.environ.get('FACEBOOK_OAUTH_CLIENT_SECRET')

# Pipeline - Define how user is created/updated
SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'accounts.pipeline.associate_by_email',
    'social_core.pipeline.user.create_user',
    'accounts.pipeline.mark_email_verified',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'accounts.pipeline.authenticate_user',  # MUST be last!
)

# What data to get from providers
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
]

SOCIAL_AUTH_GITHUB_SCOPE = ['user:email']

SOCIAL_AUTH_FACEBOOK_SCOPE = ['email']
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {
    'fields': 'id,name,email,picture'
}

# Field mapping
SOCIAL_AUTH_USER_FIELDS = ['email', 'first_name', 'last_name']
SOCIAL_AUTH_CLEAN_USERNAMES = True
SOCIAL_AUTH_POSTGRES_JSONFIELD = True

# Security
SOCIAL_AUTH_REDIRECT_IS_HTTPS = not DEBUG  # True in production
SOCIAL_AUTH_SANITIZE_REDIRECTS = True

# Redirect URLs
SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/api/auth/social/success/'
SOCIAL_AUTH_LOGIN_ERROR_URL = '/api/auth/social/error/'
SOCIAL_AUTH_NEW_USER_REDIRECT_URL = '/api/auth/social/success/'
SOCIAL_AUTH_NEW_ASSOCIATION_REDIRECT_URL = '/api/auth/social/success/'
SOCIAL_AUTH_DISCONNECT_REDIRECT_URL = '/api/auth/social/disconnected/'

CSRF_TRUSTED_ORIGINS = [
    "https://pingchart.vercel.app",
    "https://socialmedia-6.onrender.com",
    "https://*.ngrok-free.dev",
    "http://localhost:5173",
    "http://localhost:8080",
]

# ---------------------------
# CORS
# ---------------------------
CORS_ALLOW_ALL_ORIGINS = True  # Optional: you can lock to your frontend domain
# CORS_ALLOWED_ORIGINS = [
#     "https://pingchart.vercel.app",
#     "http://localhost:3000"
#     "jamal-interrogational-mariah.ngrok-free.dev",
# ]

CORS_ALLOW_CREDENTIALS = True  # ✅ Important for social auth cookies

# ---------------------------
# DEFAULT AUTO FIELD
# ---------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'



# ---------------------------
# EMAIL SETTINGS
# ---------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL")

# ---------------------------
# URL SETTINGS
# ---------------------------
FRONTEND_URL = os.environ.get("FRONTEND_URL")
BACKEND_URL = os.environ.get("BACKEND_URL")


# ---------------------------
# CELERY SETTINGS
# ---------------------------
CELERY_BROKER_URL = 'redis://redis:6379/0'  # Same Redis container
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes max