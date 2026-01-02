import os
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.conf import settings
from .models import CustomUser




class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = CustomUser
        fields = ("id", "first_name", "last_name", "full_name", "email", "avatar")

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get("request")

        avatar_url = representation.get("avatar")

        # Check if avatar exists and the file actually exists on disk
        if avatar_url and os.path.exists(os.path.join(settings.MEDIA_ROOT, avatar_url)):
            # Build absolute URL if in debug/dev mode and request exists
            if request:
                representation["avatar"] = request.build_absolute_uri(avatar_url)
        else:
            # Use default avatar if no file or missing
            representation["avatar"] = settings.DEFAULT_AVATAR_URL

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
        if attrs['password1'] != attrs['password2']:
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