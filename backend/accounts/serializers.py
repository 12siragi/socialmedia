from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from urllib.parse import urljoin
from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = CustomUser
        fields = ("id", "first_name", "last_name", "full_name", "email", "avatar")

    def to_representation(self, instance):
        """
        Override to ensure avatar returns a full URL.
        Uses default avatar if none exists.
        """
        representation = super().to_representation(instance)
        request = self.context.get("request")
        avatar_field = representation.get("avatar")

        if avatar_field:
            # If already an absolute URL, leave it
            if avatar_field.startswith("http"):
                representation["avatar"] = avatar_field
            else:
                # Build absolute URL with request if available
                if request:
                    representation["avatar"] = request.build_absolute_uri(avatar_field)
                else:
                    # Fallback for non-request context
                    representation["avatar"] = urljoin(settings.MEDIA_URL, avatar_field)
        else:
            # Default avatar
            default_avatar = getattr(settings, "DEFAULT_AVATAR_URL", "/media/avatars/default.png")
            if default_avatar.startswith("http"):
                representation["avatar"] = default_avatar
            elif request:
                representation["avatar"] = request.build_absolute_uri(default_avatar)
            else:
                representation["avatar"] = default_avatar

        return representation


# ----------------------------
# Registration serializer
# ----------------------------
class UserRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ("id", "first_name", "last_name", "email", "password1", "password2", "full_name")
        read_only_fields = ("full_name",)

    def validate(self, attrs):
        if attrs["password1"] != attrs["password2"]:
            raise serializers.ValidationError("Passwords do not match!")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")
        user = CustomUser.objects.create_user(password=password, **validated_data)

        return user


# ----------------------------
# Login serializer
# ----------------------------
class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
        user = authenticate(email=email, password=password)
        if user:
            if not user.is_email_verified:
                raise serializers.ValidationError("Email not verified. Please check your inbox.")
            return user
        raise serializers.ValidationError("Incorrect credentials!")


# ================================================================================================
# USER MANAGEMENT SERIALIZERS (NEW)
# ================================================================================================

# ----------------------------
# Profile Update Serializer
# ----------------------------
class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile (name, avatar)
    """
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'avatar']
    
    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value.strip()
    
    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Last name cannot be empty.")
        return value.strip()
    
    def validate_avatar(self, value):
        """Validate avatar file size and type"""
        if value:
            # Max 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Avatar file size cannot exceed 5MB.")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and WebP images are allowed."
                )
        
        return value


# ----------------------------
# Change Password Serializer
# ----------------------------
class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password (requires current password)
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        write_only=True,
        validators=[validate_password]
    )
    
    def validate_old_password(self, value):
        """Check if old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate(self, attrs):
        """Ensure new password is different from old"""
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                "new_password": "New password must be different from current password."
            })
        return attrs


# ----------------------------
# Change Email Serializer
# ----------------------------
class ChangeEmailSerializer(serializers.Serializer):
    """
    Serializer for changing email (requires password confirmation)
    """
    new_email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate_password(self, value):
        """Verify password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value
    
    def validate_new_email(self, value):
        """Check if email is already in use"""
        user = self.context['request'].user
        
        # Normalize email
        value = value.lower().strip()
        
        # Check if same as current
        if value == user.email:
            raise serializers.ValidationError("This is already your current email.")
        
        # Check if email exists
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        
        return value