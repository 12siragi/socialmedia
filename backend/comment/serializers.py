from rest_framework import serializers
from comment.models import Comment
from accounts.serializers import CustomUserSerializer

class CommentSerializer(serializers.ModelSerializer):
    # Nested author serializer
    author = CustomUserSerializer(read_only=True)

    # Read-only like info
    liked = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",          # Keep 'post' so frontend can do comment.post.id
            "author",
            "content",
            "created_at",
            "updated_at",
            "liked",
            "likes_count",
        ]
        read_only_fields = [
            "post",
            "author",
            "created_at",
            "updated_at",
            "likes_count",
        ]

    def get_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.liked_by.filter(id=request.user.id).exists()

    def to_representation(self, instance):
        # Get default representation
        rep = super().to_representation(instance)

        # Replace post with simple dict for frontend
        rep["post"] = {
            "id": instance.post.id,
            "content": instance.post.content[:50]  # Optional: first 50 chars
        }

        # Ensure author uses nested serializer data (already handled by CustomUserSerializer)
        # No changes needed here if you want full author info

        return rep
