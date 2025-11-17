from rest_framework import serializers
from comment.models import Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "post", "author", "content", "created_at", "updated_at"]

    def validate_author(self, value):
        """
        Prevent users from creating comments for other users.
        The author must always be the logged-in user.
        """
        request_user = self.context["request"].user
        if value != request_user:
            raise serializers.ValidationError("You cannot create a comment for another user.")
        return value

    def to_representation(self, instance):
        """
        Modify how the comment is returned in API responses.
        Instead of just showing IDs, we return useful author info.
        """
        rep = super().to_representation(instance)
        rep["author"] = {
            "id": instance.author.id,
            "username": instance.author.username,
            "email": instance.author.email,
        }
        rep["post"] = {
            "id": instance.post.id,
            "content": instance.post.content[:50]  # show only first 50 chars of post
        }
        return rep
