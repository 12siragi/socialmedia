import pytest
from accounts.models import CustomUser

@pytest.mark.django_db
def test_user_creation():
    user = CustomUser.objects.create_user(
        email="test_user@example.com",
        password="test_password",
        username="testuser"
    )

    # Check fields
    assert user.email == "test_user@example.com"
    assert user.username == "testuser"

    # Check password hashing
    assert user.check_password("test_password")

    # Check __str__ method
    assert str(user) == "test_user@example.com"
