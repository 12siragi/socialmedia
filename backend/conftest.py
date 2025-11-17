import pytest
from rest_framework.test import APIClient
from accounts.models import CustomUser

@pytest.fixture
def api_client():
    """
    Provides an unauthenticated API client for making requests in tests.
    """
    return APIClient()


@pytest.fixture
def test_user(db):
    """
    Creates and returns a test user that can be authenticated.
    """
    user = CustomUser.objects.create_user(
        email="test@example.com",
        username="testuser",
        password="testpassword"
    )
    return user


@pytest.fixture
def authenticated_client(api_client, test_user):
    """
    Returns an APIClient that is already authenticated with a test user.
    """
    api_client.force_authenticate(user=test_user)
    return api_client
