import pytest
from rest_framework import status
from accounts.models import CustomUser


@pytest.mark.django_db
def test_register_user(api_client):
    payload = {
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "newpassword123"
    }
    response = api_client.post("/api/auth/register/", payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert CustomUser.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_login_user(api_client, test_user):
    payload = {
        "email": "test@example.com",
        "password": "testpassword"
    }
    response = api_client.post("/api/auth/login/", payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_refresh_token(api_client, test_user):
    # 1. Login first
    login_response = api_client.post("/api/auth/login/", {
        "email": "test@example.com",
        "password": "testpassword"
    }, format="json")

    refresh_token = login_response.data["refresh"]

    # 2. Refresh with token
    response = api_client.post("/api/auth/refresh/", {
        "refresh": refresh_token
    }, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
