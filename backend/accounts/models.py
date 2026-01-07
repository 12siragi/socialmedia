from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings

# Safe upload path
def user_directory_path(instance, filename):
    # Handles case when user has no ID yet
    if instance.pk:
        return f"user_{instance.pk}/{filename}"
    return f"temp/{filename}"


class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=150)
    full_name = models.CharField(max_length=180, blank=True)

    avatar = models.ImageField(
        upload_to=user_directory_path,
        blank=True,
        null=True
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    @property
    def avatar_url(self):
        """
        Always return a valid avatar URL.
        """
        if self.avatar:
            return self.avatar.url
        return settings.DEFAULT_AVATAR_URL

    def __str__(self):
        return self.email
