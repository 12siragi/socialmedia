from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# ===================================================================================
# BASE CONFIGURATION
# ===================================================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", 'django-insecure-v4s^@fluo*)a8u^m(a4l4$#%bzx&mvfm$oe$lc(6yn_intj(l%')

# Always False in production
DEBUG = os.environ.get("DEBUG", "False") == "True"

ALLOWED_HOSTS = [
    "pingchart.vercel.app",
    "socialmedia-6.onrender.com",
    ".onrender.com",
    "localhost",
    "127.0.0.1",
    'jamal-interrogational-mariah.ngrok-free.dev',
]


# ===================================================================================
# APPLICATIONS
# ===================================================================================

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
    'social_django',
    
    # Your apps
    'accounts',
    'post',
    'comment',
    'content',
    'likes',
    'bookmarks',
]


# ===================================================================================
# MIDDLEWARE (OPTIMIZED)
# ===================================================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.gzip.GZipMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ===================================================================================
# TEMPLATES
# ===================================================================================

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
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]


# ===================================================================================
# URLS & WSGI
# ===================================================================================

ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'


# ===================================================================================
# DATABASE (OPTIMIZED)
# ===================================================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME"),
        "USER": os.environ.get("DB_USER"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST"),
        "PORT": os.environ.get("DB_PORT"),
        
        # OPTIMIZATION: Connection pooling
        "CONN_MAX_AGE": 300,  # 5 minutes (reduced from 10)
        "CONN_HEALTH_CHECKS": True,  # Verify connections are alive
        
        "OPTIONS": {
            "connect_timeout": 10,
            # OPTIMIZATION: Disable SSL in development if not needed
            # "sslmode": "require",  # Uncomment for production
        }   
    }
}


# ===================================================================================
# PASSWORD VALIDATORS
# ===================================================================================

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


# ===================================================================================
# INTERNATIONALIZATION
# ===================================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True


# ===================================================================================
# STATIC FILES
# ===================================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ===================================================================================
# MEDIA FILES
# ===================================================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = Path('/app/media')

# ===================================================================================
# CUSTOM USER MODEL
# ===================================================================================

AUTH_USER_MODEL = "accounts.CustomUser"


# ===================================================================================
# REST FRAMEWORK
# ===================================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # OPTIMIZATION: Pagination for all list views
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    
    # OPTIMIZATION: Throttling to prevent abuse
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # Anonymous users
        'user': '1000/hour',  # Authenticated users
    }
}


# ===================================================================================
# SIMPLE JWT (OPTIMIZED)
# ===================================================================================

SIMPLE_JWT = {
    # OPTIMIZATION: Shorter access token lifetime (more secure)
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),  # Increased from 5
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),  # Increased from 1
    
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


# ===================================================================================
# REDIS CACHE (OPTIMIZED)
# ===================================================================================

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            # OPTIMIZATION: Connection pooling
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 50,
                "retry_on_timeout": True,
            },
            # OPTIMIZATION: Compression for large values
            "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
            # OPTIMIZATION: Serializer
            "SERIALIZER": "django_redis.serializers.json.JSONSerializer",
        },
        # OPTIMIZATION: Default cache timeout
        "TIMEOUT": 300,  # 5 minutes
        "KEY_PREFIX": "pingchart",  # Namespace
        "VERSION": 1,
    }
}


# ===================================================================================
# SESSION SETTINGS (OPTIMIZED - MOVED TO REDIS)
# ===================================================================================

# OPTIMIZATION: Use Redis for sessions instead of DB
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"  # Use Redis cache

SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_SAVE_EVERY_REQUEST = False  # OPTIMIZATION: Only save when modified

# Security settings
SESSION_COOKIE_SECURE = not DEBUG  # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax' if not DEBUG else None
SESSION_COOKIE_DOMAIN = None  # Auto-detect


# ===================================================================================
# AUTHENTICATION BACKENDS (OPTIMIZED ORDER)
# ===================================================================================

# OPTIMIZATION: Most common backend first
AUTHENTICATION_BACKENDS = (
    # Email/password login (90% of logins) - CHECK FIRST
    'django.contrib.auth.backends.ModelBackend',
    
    # Social Auth Backends (10% of logins)
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.github.GithubOAuth2',
    'social_core.backends.facebook.FacebookOAuth2',
)


# ===================================================================================
# PYTHON SOCIAL AUTH SETTINGS
# ===================================================================================

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
    'accounts.pipeline.authenticate_user',  # MUST be last
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


# ===================================================================================
# CORS (OPTIMIZED)
# ===================================================================================

# OPTIMIZATION: Lock to specific origins (not all)
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only allow all in development

CORS_ALLOWED_ORIGINS = [
    "https://pingchart.vercel.app",
    "http://localhost:5173",
    "http://localhost:8080",
    "https://jamal-interrogational-mariah.ngrok-free.dev"
]

# Add ngrok in development
if DEBUG:
    CORS_ALLOWED_ORIGINS.append("https://jamal-interrogational-mariah.ngrok-free.dev")

CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r'^/(?!media/).*$'

# OPTIMIZATION: Preflight caching
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours


# ===================================================================================
# CSRF
# ===================================================================================

CSRF_TRUSTED_ORIGINS = [
    "https://pingchart.vercel.app",
    "https://jamal-interrogational-mariah.ngrok-free.dev",
    "https://*.ngrok-free.dev",
    "http://localhost:5173",
    "http://localhost:8080",
]


# ===================================================================================
# DEFAULT AUTO FIELD
# ===================================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ===================================================================================
# EMAIL SETTINGS
# ===================================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL")


# ===================================================================================
# URL SETTINGS
# ===================================================================================

FRONTEND_URL = os.environ.get("FRONTEND_URL")
BACKEND_URL = os.environ.get("BACKEND_URL")


# ===================================================================================
# CELERY SETTINGS
# ===================================================================================

CELERY_BROKER_URL = f"{REDIS_URL}/0"
CELERY_RESULT_BACKEND = f"{REDIS_URL}/0"
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes max

# OPTIMIZATION: Task result expiration
CELERY_RESULT_EXPIRES = 3600  # 1 hour

# OPTIMIZATION: Task acknowledgement
CELERY_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True


# ===================================================================================
# LOGGING (OPTIONAL - FOR PRODUCTION)
# ===================================================================================

if not DEBUG:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {message}',
                'style': '{',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
        },
    }