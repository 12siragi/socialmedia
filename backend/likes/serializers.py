# likes/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Like

User = get_user_model()


class LikeUserSerializer(serializers.ModelSerializer):
    """
    Minimal user info for "who liked this" list.
    
    OPTIMIZATION:
    - Uses precomputed fields (full_name, avatar_url)
    - No extra queries
    """
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'first_name', 'last_name', 'avatar_url']

    def get_avatar_url(self, obj):
        """Get avatar URL (precomputed in CustomUser)."""
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar_url_cached or ''


class LikeSerializer(serializers.ModelSerializer):
    """
    Serializer for Like objects.
    Used in "who liked this post" endpoint.
    """
    user = LikeUserSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']