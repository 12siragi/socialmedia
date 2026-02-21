# bookmarks/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Bookmark

User = get_user_model()


class BookmarkSerializer(serializers.ModelSerializer):
    """
    Serializer for Bookmark with post details.
    Used in "my bookmarks" list.
    
    OPTIMIZATION:
    - Includes full post data (for display)
    - Uses select_related to avoid N+1
    """
    post = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = ['id', 'post', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_post(self, obj):
        """
        Get full post data for bookmark.
        
        OPTIMIZATION:
        - Uses PostListSerializer from posts app
        - Includes author, media, likes, comments
        """
        from post.serializers import PostListSerializer
        return PostListSerializer(
            obj.post,
            context=self.context
        ).data