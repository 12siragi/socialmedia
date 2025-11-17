import pytest
from accounts.models import CustomUser
from post.models import Post
from comment.models import Comment

@pytest.mark.django_db
def test_comment_creation():
    # 1. Create a user
    user = CustomUser.objects.create_user(
        email="user@example.com",
        password="testpassword",
        username="testuser"
    )

    # 2. Create a post
    post = Post.objects.create(
        content="This is the content of the post",
        author=user
    )

    # 3. Create a comment
    comment = Comment.objects.create(
        content="This is a test comment",
        post=post,
        author=user
    )

    # ✅ 4. Assertions
    assert comment.content == "This is a test comment"
    assert comment.post == post
    assert comment.author == user
    assert str(comment) == "testuser: This is a test comment"
