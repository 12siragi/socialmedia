from rest_framework import serializers
from comment.models import Comment

class CommentSerializer(serializers.ModelSerializer):
    liked = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "content", "created_at", "updated_at", "liked", "likes_count"]
        read_only_fields = ["post", "author", "created_at", "updated_at", "likes_count"]

    def get_liked(self, obj):
        user = self.context['request'].user
        return user in obj.liked_by.all()

    def validate_author(self, value):
        request_user = self.context["request"].user
        if value != request_user:
            raise serializers.ValidationError("You cannot create a comment for another user.")
        return value

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["author"] = {
            "id": instance.author.id,
            "username": instance.author.username,
            "email": instance.author.email,
        }
        rep["post"] = {
            "id": instance.post.id,
            "content": instance.post.content[:50]
        }
        return rep
