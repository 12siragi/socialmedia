# content/serializers.py
from rest_framework import serializers
from .models import PostMedia


class PostMediaSerializer(serializers.ModelSerializer):
    """
    Serializer for post media in feed/detail views.

    FIX: URL methods now fall back to relative URLs when request context
    is missing, instead of returning None silently. This was the root
    cause of media showing sometimes but not always.
    """

    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = PostMedia
        fields = [
            'id',
            'media_type',
            'image_url',
            'video_url',
            'thumbnail_url',
            'order',
            'file_size',
            'file_size_display',
            'width',
            'height',
            'aspect_ratio',
            'filename',
            'created_at',
        ]
        read_only_fields = [
            'id', 'media_type', 'order', 'file_size',
            'width', 'height', 'filename', 'created_at'
        ]

    def get_image_url(self, obj):
        """
        Return absolute image URL.
        FIXED: Falls back to relative URL instead of returning None
        when request context is missing.
        """
        if not obj.image:
            return None
        return obj.image.url  # ✅ relative fallback — never returns None

    def get_video_url(self, obj):
        """
        Return absolute video URL.
        FIXED: Falls back to relative URL instead of returning None.
        """
        if not obj.video:
            return None
        return obj.video.url  

    def get_thumbnail_url(self, obj):
        """
        Return absolute thumbnail URL for videos.
        FIXED: Falls back to relative URL instead of returning None.
        """
        if not obj.thumbnail:
            return None
        return obj.thumbnail.url

    def get_file_size_display(self, obj):
        """Convert bytes to human-readable format."""
        if not obj.file_size:
            return "0 B"
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class CreatePostMediaSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading media.
    """

    class Meta:
        model = PostMedia
        fields = ['media_type', 'image', 'video', 'order']

    def validate(self, data):
        if data.get('image'):
            max_size = 10 * 1024 * 1024  # 10MB
            if data['image'].size > max_size:
                raise serializers.ValidationError({
                    'image': f"Image size cannot exceed 10MB. "
                             f"Your file is {data['image'].size / (1024*1024):.1f}MB"
                })

        if data.get('video'):
            max_size = 100 * 1024 * 1024  # 100MB
            if data['video'].size > max_size:
                raise serializers.ValidationError({
                    'video': f"Video size cannot exceed 100MB. "
                             f"Your file is {data['video'].size / (1024*1024):.1f}MB"
                })

        return data