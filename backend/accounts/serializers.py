from rest_framework import serializers
from django.contrib.auth import authenticate
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
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect credentials!")
