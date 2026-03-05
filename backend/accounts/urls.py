from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# ===================================================================================
# Import ALL views (make sure these match your actual files)
# ===================================================================================

from .views import (
    UserRegistrationAPIView,
    OAuthLoginAPIView,
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

from .social_views import (
    SocialAuthSuccessView,
    SocialAuthErrorView,
    SocialAuthDisconnectView,
    SocialAuthProvidersView,
    UserSocialAccountsView,
)

from .user_views import (
    UpdateProfileAPIView,
    ChangePasswordAPIView,
    SetPasswordAPIView,
    ChangeEmailAPIView,
    DeleteAccountAPIView,
    AccountSettingsAPIView,
    UserSearchView,
)

# ===================================================================================
# Router for user CRUD
# ===================================================================================
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

# ===================================================================================
# URL Patterns
# ===================================================================================
urlpatterns = [
    # ===================================================================================
    # AUTHENTICATION
    # ===================================================================================
    path('register/', UserRegistrationAPIView.as_view(), name='register'),
    path('login/', UserLoginAPIView.as_view(), name='login'),
    path('logout/', UserLogoutAPIView.as_view(), name='logout'),
    path('oauth/login/', OAuthLoginAPIView.as_view(), name='oauth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('user/', UserInfoAPIView.as_view(), name='user-info'),
    path('users/search/', UserSearchView.as_view(), name='user-search'),
    # ===================================================================================
    # EMAIL VERIFICATION
    # ===================================================================================
    path("verify-email/", VerifyEmailAPIView.as_view(), name="verify-email"),
    # ✅ FIXED: Match frontend expectation
    path('resend-verification-email/', ResendVerificationEmailAPIView.as_view(), name='resend-verification-email'),
    
    # ===================================================================================
    # PASSWORD MANAGEMENT
    # ===================================================================================
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('password-reset-confirm/', PasswordResetConfirmAPIView.as_view(), name='password-reset-confirm'),
    path('password/reset/', ResetPasswordAPIView.as_view(), name='password-reset'),
    path('password/change/', ChangePasswordAPIView.as_view(), name='password-change'),
    path('password/set/', SetPasswordAPIView.as_view(), name='password-set'),
    
    # ===================================================================================
    # PROFILE MANAGEMENT
    # ===================================================================================
    path('profile/update/', UpdateProfileAPIView.as_view(), name='profile-update'),
    path('email/change/', ChangeEmailAPIView.as_view(), name='email-change'),
    
    # ===================================================================================
    # ACCOUNT MANAGEMENT
    # ===================================================================================
    path('account/settings/', AccountSettingsAPIView.as_view(), name='account-settings'),
    path('account/delete/', DeleteAccountAPIView.as_view(), name='account-delete'),
    
    # ✅ NEW: Add the connected accounts endpoint that frontend expects
    # This is an ALIAS to the social/accounts/ endpoint
    path('account/connected/', UserSocialAccountsView.as_view(), name='account-connected'),
    
    # ===================================================================================
    # SOCIAL AUTHENTICATION
    # ===================================================================================
    # OAuth login flow (python-social-auth handles this)
    path('social/', include('social_django.urls', namespace='social')),
    
    # Custom callback handlers
    path('social/success/', SocialAuthSuccessView.as_view(), name='social-success'),
    path('social/error/', SocialAuthErrorView.as_view(), name='social-error'),
    path('social/disconnected/', SocialAuthDisconnectView.as_view(), name='social-disconnected'),
    
    # Info endpoints
    path('social/providers/', SocialAuthProvidersView.as_view(), name='social-providers'),
    path('social/accounts/', UserSocialAccountsView.as_view(), name='social-accounts'),
    
    # ===================================================================================
    # USER CRUD (VIEWSET)
    # ===================================================================================
] + router.urls