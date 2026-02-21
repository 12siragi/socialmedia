# posts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post

User = get_user_model()


# ===================================================================================
# AUTHOR SERIALIZER
# ===================================================================================

class PostAuthorSerializer(serializers.ModelSerializer):
    """
    Minimal author info for posts.
    
    OPTIMIZATION: Uses precomputed fields from CustomUser
    - full_name already computed ✅
    - avatar_url already computed ✅
    """
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'first_name', 'last_name', 'avatar_url']

    def get_avatar_url(self, obj):
        """
        Get avatar URL.
        Uses precomputed avatar_url property from CustomUser.
        """
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar_url_cached or ''


# ===================================================================================
# POST LIST SERIALIZER (Feed)
# ===================================================================================

class PostListSerializer(serializers.ModelSerializer):
    """
    Serializer for post feed/list.
    
    OPTIMIZATION:
    - Uses prefetched data (no extra queries)
    - Includes media and bookmarks for feed
    - Precomputed counters (likes_count, comments_count)
    """
    author = PostAuthorSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()  # ✅ ADDED
    media = serializers.SerializerMethodField()          # ✅ ADDED
    media_count = serializers.SerializerMethodField()
    comments_preview = serializers.SerializerMethodField()  # ✅ ADDED

    class Meta:
        model = Post
        fields = [
            'id',
            'author',
            'content',
            'post_type',
            'media',              # ✅ ADDED
            'likes_count',
            'comments_count',
            'media_count',
            'is_liked',
            'is_bookmarked',      # ✅ ADDED
            'comments_preview',   # ✅ ADDED
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'author', 'likes_count', 'comments_count',
            'created_at', 'updated_at'
        ]

    def get_is_liked(self, obj):
        """
        Check if current user liked this post.
        
        OPTIMIZATION: Uses prefetched likes data
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(
                like.user_id == request.user.id
                for like in obj.likes.all()
            )
        return False

    def get_is_bookmarked(self, obj):
        """
        Check if current user bookmarked this post.
        
        OPTIMIZATION: Uses prefetched bookmarks data
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(
                bookmark.user_id == request.user.id
                for bookmark in obj.bookmarks.all()
            )
        return False

    def get_media(self, obj):
        """
        Get all media for this post.
        
        OPTIMIZATION: Uses prefetched media data
        """
        from content.serializers import PostMediaSerializer
        
        if not hasattr(obj, 'media'):
            return []
            
        return PostMediaSerializer(
            obj.media.all(),
            many=True,
            context=self.context
        ).data

    def get_media_count(self, obj):
        """Count media without extra query."""
        if hasattr(obj, '_prefetched_objects_cache') and 'media' in obj._prefetched_objects_cache:
            return len(obj.media.all())
        return 0

    def get_comments_preview(self, obj):
        """
        Get top 3 comments for preview.
        
        OPTIMIZATION: Simple serialization to avoid circular imports
        """
        if not hasattr(obj, 'comments'):
            return []
        
        # Get top-level active comments
        top_comments = obj.comments.filter(
            is_active=True,
            parent=None
        ).select_related('author')[:3]
        
        # Simple serialization
        return [{
            'id': c.id,
            'author': {
                'id': c.author.id,
                'full_name': c.author.full_name,
                'first_name': c.author.first_name,
                'last_name': c.author.last_name,
                'avatar_url': c.author.avatar.url if c.author.avatar else c.author.avatar_url_cached
            },
            'content': c.content,
            'created_at': c.created_at,
        } for c in top_comments]


# ===================================================================================
# POST DETAIL SERIALIZER
# ===================================================================================

class PostDetailSerializer(serializers.ModelSerializer):
    """
    Full post details with media, comments preview.
    Used for single post view.
    
    OPTIMIZATION:
    - Lazy imports to avoid circular imports
    - Uses prefetched data
    """
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
        """Get all media for this post."""
        from content.serializers import PostMediaSerializer
        
        if not hasattr(obj, 'media'):
            return []
            
        return PostMediaSerializer(
            obj.media.all(),
            many=True,
            context=self.context
        ).data

    def get_is_liked(self, obj):
        """Check if current user liked this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(
                like.user_id == request.user.id
                for like in obj.likes.all()
            )
        return False

    def get_is_bookmarked(self, obj):
        """Check if current user bookmarked this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(
                bookmark.user_id == request.user.id
                for bookmark in obj.bookmarks.all()
            )
        return False

    def get_comments_preview(self, obj):
        """Get top 3 comments for preview."""
        if not hasattr(obj, 'comments'):
            return []
        
        top_comments = obj.comments.filter(
            is_active=True,
            parent=None
        ).select_related('author')[:3]
        
        return [{
            'id': c.id,
            'author': {
                'id': c.author.id,
                'full_name': c.author.full_name,
                'first_name': c.author.first_name,
                'last_name': c.author.last_name,
                'avatar_url': c.author.avatar.url if c.author.avatar else c.author.avatar_url_cached
            },
            'content': c.content,
            'created_at': c.created_at,
        } for c in top_comments]


# ===================================================================================
# CREATE POST SERIALIZER
# ===================================================================================

class CreatePostSerializer(serializers.ModelSerializer):
    """
    Serializer for creating posts.
    
    FEATURES:
    - Accepts multiple media files
    - Auto-detects post_type
    - Validates content + media presence
    """
    media_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
        help_text="List of image/video files"
    )

    class Meta:
        model = Post
        fields = ['content', 'post_type', 'media_files']
        extra_kwargs = {
            'post_type': {'required': False}  # Auto-detected
        }

    def validate(self, data):
        """
        Validate that post has content or media.
        Auto-detect post_type based on content + media.
        """
        content = data.get('content', '').strip() if data.get('content') else ''
        media_files = data.get('media_files', [])

        # Must have content OR media
        if not content and not media_files:
            raise serializers.ValidationError(
                "Post must have either content or media."
            )

        # Auto-detect post_type
        if media_files and content:
            data['post_type'] = 'mixed'
        elif media_files:
            # Check first file type
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
        """
        Create post and associated media.
        
        OPTIMIZATION: Uses bulk_create for media
        """
        from content.models import PostMedia
        
        media_files = validated_data.pop('media_files', [])
        request = self.context['request']

        # Create post
        post = Post.objects.create(
            author=request.user,
            **validated_data
        )

        # Create media records
        if media_files:
            media_objects = []
            for i, file in enumerate(media_files):
                content_type = getattr(file, 'content_type', '')
                is_image = content_type.startswith('image/')
                media_type = 'image' if is_image else 'video'

                media_obj = PostMedia(
                    post=post,
                    media_type=media_type,
                    order=i
                )

                if is_image:
                    media_obj.image = file
                else:
                    media_obj.video = file

                media_objects.append(media_obj)

            # ✅ Bulk create - single INSERT query
            PostMedia.objects.bulk_create(media_objects)

        return post


# ===================================================================================
# UPDATE POST SERIALIZER
# ===================================================================================

class UpdatePostSerializer(serializers.ModelSerializer):
    """
    Serializer for updating posts.
    Only allows updating content (not media or type).
    """

    class Meta:
        model = Post
        fields = ['content']

    def update(self, instance, validated_data):
        """Update post content only."""
        instance.content = validated_data.get('content', instance.content)
        instance.save(update_fields=['content', 'updated_at'])
        return instance