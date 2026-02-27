# content/serializers.py
from rest_framework import serializers
from .models import PostMedia


def _force_https(url):
    """
    Force HTTPS on any URL.
    Needed because ngrok/backend builds http:// URLs but
    frontend is on https:// (Vercel) — browser blocks mixed content.
    """
    if url and url.startswith('http://'):
        return url.replace('http://', 'https://', 1)
    return url


class PostMediaSerializer(serializers.ModelSerializer):
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
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return _force_https(request.build_absolute_uri(obj.image.url))
        return obj.image.url  # relative fallback

    def get_video_url(self, obj):
        if not obj.video:
            return None
        request = self.context.get('request')
        if request:
            return _force_https(request.build_absolute_uri(obj.video.url))
        return obj.video.url  # relative fallback

    def get_thumbnail_url(self, obj):
        if not obj.thumbnail:
            return None
        request = self.context.get('request')
        if request:
            return _force_https(request.build_absolute_uri(obj.thumbnail.url))
        return obj.thumbnail.url  # relative fallback

    def get_file_size_display(self, obj):
        if not obj.file_size:
            return "0 B"
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class CreatePostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ['media_type', 'image', 'video', 'order']

    def validate(self, data):
        if data.get('image'):
            max_size = 10 * 1024 * 1024
            if data['image'].size > max_size:
                raise serializers.ValidationError({
                    'image': f"Image size cannot exceed 10MB. "
                             f"Your file is {data['image'].size / (1024*1024):.1f}MB"
                })
        if data.get('video'):
            max_size = 100 * 1024 * 1024
            if data['video'].size > max_size:
                raise serializers.ValidationError({
                    'video': f"Video size cannot exceed 100MB. "
                             f"Your file is {data['video'].size / (1024*1024):.1f}MB"
                })
        return data