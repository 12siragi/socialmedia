# accounts/social_views.py

"""
Custom views for social authentication.

Handles the OAuth callback and generates JWT tokens for the frontend.
"""

from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)


class SocialAuthSuccessView(APIView):
    """
    Called after successful OAuth login.
    
    Generates JWT tokens and redirects to frontend with tokens in URL.
    
    Flow:
    1. User clicks "Login with Google" → redirected to Google
    2. User approves → Google redirects back to Django
    3. Django processes OAuth → creates/links user
    4. This view generates JWT tokens
    5. Redirects to frontend with tokens
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        
        if not user.is_authenticated:
            logger.warning("⚠️ Social auth success but user not authenticated")
            return redirect(f"{settings.FRONTEND_URL}/login?error=authentication_failed")

        # Generate JWT tokens (same as email login)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        logger.info(f"✅ Social login successful for: {user.email}")

        # Redirect to frontend with tokens
        params = urlencode({
            'access': access_token,
            'refresh': refresh_token,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })
        
        redirect_url = f"{settings.FRONTEND_URL}/social-login-success?{params}"
        return redirect(redirect_url)


class SocialAuthErrorView(APIView):
    """
    Called when OAuth login fails.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        error = request.GET.get('error', 'unknown_error')
        logger.error(f"❌ Social auth error: {error}")
        
        return redirect(f"{settings.FRONTEND_URL}/login?error={error}")


class SocialAuthDisconnectView(APIView):
    """
    Called after user disconnects a social account.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return redirect(f"{settings.FRONTEND_URL}/settings?message=account_disconnected")


class SocialAuthProvidersView(APIView):
    """
    Get list of available social auth providers.
    
    Useful for frontend to know which login buttons to show.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        providers = []
        
        if settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
            providers.append({
                'name': 'google-oauth2',
                'display_name': 'Google',
                'login_url': '/api/auth/social/login/google-oauth2/'
            })
        
        if settings.SOCIAL_AUTH_GITHUB_KEY:
            providers.append({
                'name': 'github',
                'display_name': 'GitHub',
                'login_url': '/api/auth/social/login/github/'
            })
        
        if settings.SOCIAL_AUTH_FACEBOOK_KEY:
            providers.append({
                'name': 'facebook',
                'display_name': 'Facebook',
                'login_url': '/api/auth/social/login/facebook/'
            })
        
        return Response({
            'providers': providers,
            'count': len(providers)
        })


class UserSocialAccountsView(APIView):
    """
    Get user's connected social accounts.
    
    Shows which OAuth providers are linked to their account.
    """
    from rest_framework.permissions import IsAuthenticated
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all social auth accounts for this user
        from social_django.models import UserSocialAuth
        social_accounts = UserSocialAuth.objects.filter(user=user)
        
        accounts = []
        for account in social_accounts:
            accounts.append({
                'provider': account.provider,
                'uid': account.uid,
                'created': account.created,
            })
        
        return Response({
            'social_accounts': accounts,
            'count': len(accounts)
        })

    def delete(self, request):
        """
        Disconnect a social account.
        
        POST body: { "provider": "google-oauth2" }
        """
        provider = request.data.get('provider')
        
        if not provider:
            return Response(
                {'detail': 'Provider is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        from social_django.models import UserSocialAuth
        
        try:
            social_account = UserSocialAuth.objects.get(
                user=user,
                provider=provider
            )
            
            # Check if user has other login methods
            has_password = user.has_usable_password()
            other_socials = UserSocialAuth.objects.filter(user=user).exclude(provider=provider).exists()
            
            if not has_password and not other_socials:
                return Response(
                    {'detail': 'Cannot disconnect last login method. Set a password first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            social_account.delete()
            logger.info(f"✅ Disconnected {provider} for user: {user.email}")
            
            return Response({
                'detail': f'{provider} account disconnected successfully'
            })
            
        except UserSocialAuth.DoesNotExist:
            return Response(
                {'detail': f'No {provider} account found'},
                status=status.HTTP_404_NOT_FOUND
            )