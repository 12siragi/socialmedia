# posts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post

User = get_user_model()

def _force_https(url):
    """
    Force HTTPS on any URL.
    Needed because ngrok/backend builds http:// URLs but
    frontend is on https:// (Vercel) — browser blocks mixed content.
    """
    if url and url.startswith('http://'):
        return url.replace('http://', 'https://', 1)
    return url


# ===================================================================================
# AUTHOR SERIALIZER
# ===================================================================================

class PostAuthorSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'first_name', 'last_name', 'avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return _force_https(request.build_absolute_uri(obj.avatar.url))
        return obj.avatar_url_cached or ''


# ===================================================================================
# SHARED HELPERS
# ===================================================================================

def _get_media(obj, context):
    from content.serializers import PostMediaSerializer
    try:
        media_qs = obj.media.all()
        if not media_qs:
            return []
        return PostMediaSerializer(media_qs, many=True, context=context).data
    except Exception:
        return []


def _get_is_liked(obj, context):
    request = context.get('request')
    if request and request.user.is_authenticated:
        return any(like.user_id == request.user.id for like in obj.likes.all())
    return False


def _get_is_bookmarked(obj, context):
    request = context.get('request')
    if request and request.user.is_authenticated:
        return any(bookmark.user_id == request.user.id for bookmark in obj.bookmarks.all())
    return False


def _get_comments_preview(obj, context):
    if not hasattr(obj, 'comments'):
        return []

    request = context.get('request')
    top_comments = obj.comments.filter(
        is_active=True,
        parent=None
    ).select_related('author')[:3]

    result = []
    for c in top_comments:
        if c.author.avatar:
            if request:
 
                avatar_url = _force_https(request.build_absolute_uri(c.author.avatar.url))
            else:
                avatar_url = c.author.avatar.url
        else:
            avatar_url = c.author.avatar_url_cached or ''

        result.append({
            'id': c.id,
            'author': {
                'id': c.author.id,
                'full_name': c.author.full_name,
                'first_name': c.author.first_name,
                'last_name': c.author.last_name,
                'avatar_url': avatar_url,
            },
            'content': c.content,
            'created_at': c.created_at,
        })
    return result


# ===================================================================================
# POST LIST SERIALIZER (Feed)
# ===================================================================================

class PostListSerializer(serializers.ModelSerializer):
    author = PostAuthorSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    comments_preview = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'author',
            'content',
            'post_type',
            'media',
            'likes_count',
            'comments_count',
            'media_count',
            'is_liked',
            'is_bookmarked',
            'comments_preview',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'author', 'likes_count', 'comments_count',
            'created_at', 'updated_at'
        ]

    def get_media(self, obj):
        return _get_media(obj, self.context)

    def get_is_liked(self, obj):
        return _get_is_liked(obj, self.context)

    def get_is_bookmarked(self, obj):
        return _get_is_bookmarked(obj, self.context)

    def get_media_count(self, obj):
        try:
            return len(obj.media.all())
        except Exception:
            return 0

    def get_comments_preview(self, obj):
        return _get_comments_preview(obj, self.context)


# ===================================================================================
# POST DETAIL SERIALIZER
# ===================================================================================

class PostDetailSerializer(serializers.ModelSerializer):
    author = PostAuthorSerializer(read_only=True)
    media = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    comments_preview = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'author',
            'content',
            'post_type',
            'media',
            'likes_count',
            'comments_count',
            'is_liked',
            'is_bookmarked',
            'comments_preview',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'author', 'likes_count', 'comments_count',
            'created_at', 'updated_at'
        ]

    def get_media(self, obj):
        return _get_media(obj, self.context)

    def get_is_liked(self, obj):
        return _get_is_liked(obj, self.context)

    def get_is_bookmarked(self, obj):
        return _get_is_bookmarked(obj, self.context)

    def get_comments_preview(self, obj):
        return _get_comments_preview(obj, self.context)


# ===================================================================================
# CREATE POST SERIALIZER
# ===================================================================================

class CreatePostSerializer(serializers.ModelSerializer):
    media_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Post
        fields = ['content', 'post_type', 'media_files']
        extra_kwargs = {'post_type': {'required': False}}

    def validate(self, data):
        content = data.get('content', '').strip() if data.get('content') else ''
        media_files = data.get('media_files', [])

        if not content and not media_files:
            raise serializers.ValidationError(
                "Post must have either content or media."
            )

        if media_files and content:
            data['post_type'] = 'mixed'
        elif media_files:
            first_file = media_files[0]
            content_type = getattr(first_file, 'content_type', '')
            if content_type.startswith('image/'):
                data['post_type'] = 'image'
            elif content_type.startswith('video/'):
                data['post_type'] = 'video'
            else:
                data['post_type'] = 'mixed'
        else:
            data['post_type'] = 'text'

        return data

    def create(self, validated_data):
        from content.models import PostMedia

        media_files = validated_data.pop('media_files', [])
        request = self.context['request']

        post = Post.objects.create(author=request.user, **validated_data)

        if media_files:
            media_objects = []
            for i, file in enumerate(media_files):
                content_type = getattr(file, 'content_type', '')
                is_image = content_type.startswith('image/')
                media_type = 'image' if is_image else 'video'
                media_obj = PostMedia(post=post, media_type=media_type, order=i)
                if is_image:
                    media_obj.image = file
                else:
                    media_obj.video = file
                media_objects.append(media_obj)
            PostMedia.objects.bulk_create(media_objects)

        return post


# ===================================================================================
# UPDATE POST SERIALIZER
# ===================================================================================

class UpdatePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['content']

    def update(self, instance, validated_data):
        instance.content = validated_data.get('content', instance.content)
        instance.save(update_fields=['content', 'updated_at'])
        return instance