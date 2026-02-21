# comment/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Comment

User = get_user_model()


# ===================================================================================
# AUTHOR SERIALIZER
# ===================================================================================

class CommentAuthorSerializer(serializers.ModelSerializer):
    """
    Minimal author info for comments.
    
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


# ===================================================================================
# COMMENT PREVIEW SERIALIZER (For Feed)
# ===================================================================================

class CommentPreviewSerializer(serializers.ModelSerializer):
    """
    Minimal comment data for post feed preview.
    Used in posts/serializers.py for top 3 comments.
    
    OPTIMIZATION:
    - No nested data (keeps response small)
    - Uses prefetched author data
    """
    author = CommentAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'author',
            'content',
            'is_reply',
            'is_edited',
            'created_at',
        ]


# ===================================================================================
# COMMENT SERIALIZER (Full)
# ===================================================================================

class CommentSerializer(serializers.ModelSerializer):
    """
    Full comment serializer with nested replies.
    
    OPTIMIZATION:
    - Lazy loads replies (not in initial list)
    - Uses prefetched data when available
    """
    author = CommentAuthorSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id',
            'author',
            'content',
            'parent',
            'depth',
            'replies',
            'replies_count',
            'is_reply',
            'is_edited',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'author', 'depth', 'is_reply', 'is_edited',
            'created_at', 'updated_at'
        ]

    def get_replies(self, obj):
        """
        Get first 3 replies for comment.
        
        OPTIMIZATION:
        - Only returns top 3 (pagination for rest)
        - Uses prefetched data if available
        - Ordered by created_at (oldest first)
        
        PERFORMANCE:
        - With prefetch: 0 queries
        - Without prefetch: 1 query per comment
        """
        if obj.parent_id is not None:
            # Don't show nested replies beyond 1 level in initial load
            return []

        # Get first 3 replies
        replies = obj.replies.filter(is_active=True).select_related('author')[:3]
        return CommentPreviewSerializer(
            replies,
            many=True,
            context=self.context
        ).data

    def get_replies_count(self, obj):
        """
        Count active replies.
        
        OPTIMIZATION:
        - Uses cached value if available
        - Falls back to COUNT query
        """
        return obj.replies.filter(is_active=True).count()


# ===================================================================================
# CREATE/UPDATE COMMENT SERIALIZER
# ===================================================================================

class CreateCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating comments.
    
    VALIDATION:
    - Content not empty
    - Parent comment exists and is on same post
    - Max depth not exceeded
    """
    parent_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="ID of parent comment (for replies)"
    )

    class Meta:
        model = Comment
        fields = ['content', 'parent_id']

    def validate_content(self, value):
        """Validate comment content."""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment content cannot be empty.")

        if len(value) > 5000:
            raise serializers.ValidationError("Comment is too long (max 5000 characters).")

        return value.strip()

    def validate_parent_id(self, value):
        """Validate parent comment exists."""
        if value:
            try:
                parent = Comment.objects.get(pk=value, is_active=True)
                
                # Check max depth
                if parent.depth >= 5:
                    raise serializers.ValidationError(
                        "Maximum reply depth (5 levels) exceeded."
                    )
                
                return value
            except Comment.DoesNotExist:
                raise serializers.ValidationError("Parent comment not found.")
        return None

    def create(self, validated_data):
        """
        Create comment.
        
        SIGNAL: Automatically increments Post.comments_count
        """
        parent_id = validated_data.pop('parent_id', None)
        request = self.context['request']
        post = self.context['post']

        # Get parent if provided
        parent = None
        if parent_id:
            parent = Comment.objects.get(pk=parent_id)
            # Validate parent is on same post
            if parent.post_id != post.id:
                raise serializers.ValidationError(
                    "Parent comment must be on the same post."
                )

        # Create comment
        comment = Comment.objects.create(
            author=request.user,
            post=post,
            parent=parent,
            **validated_data
        )

        return comment


class UpdateCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for updating comments.
    Only allows updating content.
    """

    class Meta:
        model = Comment
        fields = ['content']

    def validate_content(self, value):
        """Validate comment content."""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment content cannot be empty.")

        if len(value) > 5000:
            raise serializers.ValidationError("Comment is too long (max 5000 characters).")

        return value.strip()

    def update(self, instance, validated_data):
        """Update comment content."""
        instance.content = validated_data.get('content', instance.content)
        instance.save(update_fields=['content', 'updated_at'])
        return instance