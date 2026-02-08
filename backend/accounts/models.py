from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings


# ===================================================================================
# UPLOAD PATH HELPER
# ===================================================================================

def user_directory_path(instance, filename):
    """
    Safe upload path for user avatars.
    
    OPTIMIZATION: Uses user.pk to organize files by user
    Avoids name collisions and makes cleanup easier
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
        Create regular user.
        
        PERFORMANCE: Single INSERT query
        """
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
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

        return self.create_user(email, password, **extra_fields)


# ===================================================================================
# CUSTOM USER MODEL
# ===================================================================================

class CustomUser(AbstractUser):
    """
    Custom user model with email authentication.
    
    INDEXES:
    1. email - Unique + indexed (login queries)
    2. is_email_verified - Filter verified users
    3. (email, is_active) - Composite for login validation
    4. last_name - Sorting/searching users
    5. date_joined - Recent users queries
    
    PERFORMANCE IMPACT:
    - Login query: O(log n) instead of O(n)
    - User search: O(log n) instead of O(n)
    - Paginated lists: Fast with proper indexes
    """
    
    # Remove username field (using email instead)
    username = None

    # Core fields with indexes
    email = models.EmailField(
        unique=True,
        db_index=True,  # Index for fast email lookups
        help_text="User's email address (used for login)"
    )
    
    first_name = models.CharField(
        max_length=30,
        help_text="User's first name"
    )
    
    last_name = models.CharField(
        max_length=150,
        db_index=True,  # Index for sorting by last name
        help_text="User's last name"
    )
    
    full_name = models.CharField(
        max_length=180,
        blank=True,
        help_text="Computed full name (auto-generated)"
    )

    # Avatar field
    avatar = models.ImageField(
        upload_to=user_directory_path,
        blank=True,
        null=True,
        help_text="User's profile picture"
    )

    # Email verification
    is_email_verified = models.BooleanField(
        default=False,
        db_index=True,  # Index for filtering verified users
        help_text="Whether user's email is verified"
    )

    # Meta configuration
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        
        # Database indexes for optimal query performance
        indexes = [
            # Single-column indexes
            models.Index(
                fields=['email'],
                name='idx_user_email'
            ),
            models.Index(
                fields=['is_email_verified'],
                name='idx_user_verified'
            ),
            models.Index(
                fields=['last_name'],
                name='idx_user_lastname'
            ),
            models.Index(
                fields=['date_joined'],
                name='idx_user_joined'
            ),
            
            # Composite indexes for common query patterns
            models.Index(
                fields=['email', 'is_active'],
                name='idx_user_email_active'
            ),
            models.Index(
                fields=['is_email_verified', 'is_active'],
                name='idx_user_verified_active'
            ),
            models.Index(
                fields=['last_name', 'first_name'],
                name='idx_user_name_sort'
            ),
        ]
        
        # Default ordering (uses index!)
        ordering = ['-date_joined']  # Newest first

    # Authentication configuration
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        """
        Override save to auto-compute full_name.
        
        OPTIMIZATION: Computed field avoids concatenation in queries
        """
        self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    @property
    def avatar_url(self):
        """
        Always return a valid avatar URL.
        
        OPTIMIZATION: No DB query (uses in-memory field)
        """
        if self.avatar:
            return self.avatar.url
        return getattr(settings, 'DEFAULT_AVATAR_URL', '/static/default-avatar.png')

    def __str__(self):
        return self.email