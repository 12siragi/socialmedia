from cloudinary_storage.storage import MediaCloudinaryStorage
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings
import urllib.parse

# ===================================================================================
# UPLOAD PATH HELPER
# ===================================================================================

def user_directory_path(instance, filename):
    """
    Safe upload path for user avatars.
    """
    if instance.pk:
        return f"avatars/user_{instance.pk}/{filename}"
    return f"avatars/temp/{filename}"
# ===================================================================================
# CUSTOM USER MANAGER
# ===================================================================================

class CustomUserManager(BaseUserManager):
    """
    Manager for CustomUser model.

    OPTIMIZATIONS:
    - normalize_email for consistent lookups
    - Minimal DB queries (single INSERT)
    """
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        """
        Create regular user with email/password.

        PERFORMANCE: Single INSERT query
        """
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        extra_fields.setdefault('auth_provider', 'email')
        

        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create superuser/admin.

        PERFORMANCE: Single INSERT query
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("auth_provider", "email")

        return self.create_user(email, password, **extra_fields)

    def create_oauth_user(self, email, provider='google', provider_id=None, **extra_fields):
        """
        Create user from OAuth (Google, etc.) - no password needed.

        USAGE:
            CustomUser.objects.create_oauth_user(
                email='user@gmail.com',
                provider='google',
                provider_id='123456789',
                first_name='John',
                last_name='Doe'
            )
        """
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        extra_fields['auth_provider'] = provider
        extra_fields['is_email_verified'] = True  # OAuth emails are pre-verified

        if provider == 'google' and provider_id:
            extra_fields['google_id'] = provider_id

        user = self.model(email=email, **extra_fields)
        user.set_unusable_password()  # OAuth users don't have passwords
        user.save(using=self._db)
        return user


# ===================================================================================
# CUSTOM USER MODEL
# ===================================================================================

class CustomUser(AbstractUser):
    """
    Custom user model with email authentication and OAuth support.

    AUTHENTICATION METHODS:
    1. Email/Password - Traditional signup
    2. Google OAuth - Social login (no password)

    PERFORMANCE OPTIMIZATIONS:
    - Precomputed fields: full_name, avatar_url_cached
    - Comprehensive indexes for fast queries
    - Avoids N+1 queries with proper select_related/prefetch_related

    INDEXES:
    1. email - Unique + indexed (login queries)
    2. is_email_verified - Filter verified users
    3. auth_provider - Filter by signup method
    4. google_id - OAuth lookups
    5. (email, is_active) - Composite for login validation
    6. (auth_provider, is_email_verified) - Composite for OAuth verified users
    7. last_name - Sorting/searching users
    8. date_joined - Recent users queries
    """

    # Remove username field (using email instead)
    username = None

    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="User's email address (used for login)"
    )

    first_name = models.CharField(
        max_length=30,
        help_text="User's first name"
    )

    last_name = models.CharField(
        max_length=150,
        db_index=True,
        help_text="User's last name"
    )

    full_name = models.CharField(
        max_length=180,
        blank=True,
        help_text="Computed full name (auto-generated on save)"
    )

    avatar = models.ImageField(
        upload_to=user_directory_path,
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(),  
        help_text="User's profile picture"
    )

    avatar_url_cached = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Cached avatar URL for users without uploaded avatars"
    )

    is_email_verified = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether user's email is verified"
    )

    auth_provider = models.CharField(
        max_length=50,
        default='email',
        choices=[
            ('email', 'Email/Password'),
            ('google', 'Google OAuth'),
        ],
        db_index=True,
        help_text="How the user signed up/authenticated"
    )

    google_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        db_index=True,
        help_text="Google OAuth user ID (sub claim from Google)"
    )
    LANG_CHOICES = [
       
        ("en", "English"),
        
        ("ar", "Arabic"),
    
]

    preferred_language = models.CharField(
        max_length=10,
        choices=LANG_CHOICES,
        default="en"
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

        indexes = [
            models.Index(fields=['email'],              name='idx_user_email'),
            models.Index(fields=['is_email_verified'],  name='idx_user_verified'),
            models.Index(fields=['last_name'],          name='idx_user_lastname'),
            models.Index(fields=['date_joined'],        name='idx_user_joined'),
            models.Index(fields=['auth_provider'],      name='idx_user_provider'),
            models.Index(fields=['google_id'],          name='idx_user_google_id'),

            # Composite indexes
            models.Index(fields=['email', 'is_active'],              name='idx_user_email_active'),
            models.Index(fields=['is_email_verified', 'is_active'],  name='idx_user_verified_active'),
            models.Index(fields=['last_name', 'first_name'],         name='idx_user_name_sort'),
            models.Index(fields=['auth_provider', 'is_active'],      name='idx_user_provider_active'),
            models.Index(fields=['auth_provider', 'is_email_verified'], name='idx_provider_verified'),
        ]

        ordering = ['-date_joined']

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        """
        Override save to precompute expensive fields.

        OPTIMIZATIONS:
        1. full_name - avoids concatenation in queries/templates
        2. avatar_url_cached - avoids repeated URL generation
        """
        self.full_name = f"{self.first_name} {self.last_name}".strip()

        if not self.avatar:
            name = self.full_name or self.email.split('@')[0]
            encoded_name = urllib.parse.quote_plus(name)
            self.avatar_url_cached = (
                f"https://ui-avatars.com/api/"
                f"?name={encoded_name}"
                f"&background=random"
                f"&color=fff"
                f"&rounded=true"
            )
        else:
            self.avatar_url_cached = None

        super().save(*args, **kwargs)

    @property
    def avatar_url(self):
        """
        Returns avatar URL (uploaded or generated).
        OPTIMIZATION: Uses cached value from DB instead of computing.
        """
        if self.avatar:
            return self.avatar.url
        return self.avatar_url_cached or ''

    @property
    def has_password(self):
        """Check if user has a usable password."""
        return self.has_usable_password()

    @property
    def is_oauth_user(self):
        """Check if user signed up via OAuth (no password)."""
        return self.auth_provider != 'email'

    def __str__(self):
        return self.email