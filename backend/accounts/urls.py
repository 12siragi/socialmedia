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
    ResendVerificationEmailAPIView,
    ForgotPasswordAPIView,
    PasswordResetConfirmAPIView,
    ResetPasswordAPIView,
)

# ✅ Import social auth views
from .social_views import (
    SocialAuthSuccessView,
    SocialAuthErrorView,
    SocialAuthDisconnectView,
    SocialAuthProvidersView,
    UserSocialAccountsView,
)

router = DefaultRouter()
router.register(r'user', UserViewSet, basename='user')

urlpatterns = [
    # Email/Password Authentication
    path('register/', UserRegistrationAPIView.as_view(), name='register-user'),
    path('login/', UserLoginAPIView.as_view(), name='login-user'),
    path('logout/', UserLogoutAPIView.as_view(), name='logout-user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('user/info/', UserInfoAPIView.as_view(), name='user-info'),
    
    # Email Verification
    path("verify-email/", VerifyEmailAPIView.as_view(), name="verify-email"),
    path('resend-verification-email/', ResendVerificationEmailAPIView.as_view(), name='resend-verification-email'),
    
    # Password Reset
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('password-reset-confirm/', PasswordResetConfirmAPIView.as_view(), name='password-reset-confirm'),
    path('reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),
    
    # ✅ Social Authentication
    # OAuth login flow (python-social-auth handles this)
    path('social/', include('social_django.urls', namespace='social')),
    
    # Custom callback handlers
    path('social/success/', SocialAuthSuccessView.as_view(), name='social-auth-success'),
    path('social/error/', SocialAuthErrorView.as_view(), name='social-auth-error'),
    path('social/disconnected/', SocialAuthDisconnectView.as_view(), name='social-auth-disconnected'),
    
    # Info endpoints
    path('social/providers/', SocialAuthProvidersView.as_view(), name='social-providers'),
    path('social/accounts/', UserSocialAccountsView.as_view(), name='user-social-accounts'),
]

urlpatterns += router.urls