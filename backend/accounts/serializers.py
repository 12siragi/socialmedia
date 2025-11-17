from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


# Serializer to return user info
class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()  # auto-generated

    class Meta:
        model = CustomUser
        fields = ("id", "first_name", "last_name", "full_name", "email")


# Serializer for user registration
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

        # Create user using custom manager (hashes password)
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user


# Serializer for user login
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
