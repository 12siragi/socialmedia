# accounts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationAPIView,
    UserLoginAPIView,
    UserLogoutAPIView,
    UserInfoAPIView,
    UserViewSet,
    VerifyEmailAPIView,
    ResendVerificationEmailAPIView
)

router = DefaultRouter()
router.register(r'user', UserViewSet, basename='user')  # <-- exposes /api/user/ endpoints

urlpatterns = [
    path('register/', UserRegistrationAPIView.as_view(), name='register-user'),
    path('login/', UserLoginAPIView.as_view(), name='login-user'),
    path('logout/', UserLogoutAPIView.as_view(), name='logout-user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('user/info/', UserInfoAPIView.as_view(), name='user-info'),  # current user info
    path("verify-email/", VerifyEmailAPIView.as_view(), name="verify-email"),
    path('resend-verification-email/', ResendVerificationEmailAPIView.as_view(), name='resend-verification-email'),
]

urlpatterns += router.urls  # <-- add the router URLs
