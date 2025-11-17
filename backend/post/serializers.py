from rest_framework import serializers
from .models import Post
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator

class PostSerializer(serializers.ModelSerializer):
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ["id", "content", "image", "created_at", "author", "likes_count"]
        read_only_fields = ["id", "created_at"]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        if len(value) > 500:
            raise serializers.ValidationError("Content cannot exceed 500 characters.")
        return value
