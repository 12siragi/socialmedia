from django.shortcuts import redirect
from django.conf import settings
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
from social_django.utils import load_strategy
import logging

logger = logging.getLogger(__name__)

# Cache timeout constants
PROVIDERS_CACHE_TIMEOUT = 300  # 5 minutes
USER_SOCIAL_ACCOUNTS_CACHE_TIMEOUT = 60  # 1 minute


# ===================================================================================
# CACHE HELPER FUNCTIONS
# ===================================================================================

def get_providers_cache_key():
    """Cache key for providers list"""
    return "social_auth:providers"


def get_user_social_accounts_cache_key(user_id):
    """Cache key for user's social accounts"""
    return f"social_auth:user_accounts:{user_id}"


def invalidate_user_social_cache(user_id):
    """Invalidate cache when user's social accounts change"""
    cache.delete(get_user_social_accounts_cache_key(user_id))
    logger.debug(f"Invalidated social accounts cache for user {user_id}")


# ===================================================================================
# VIEWS
# ===================================================================================

class SocialAuthSuccessView(APIView):
    """
    Called after successful OAuth login.
    
    Retrieves user from strategy session (survives redirect).
    Generates JWT tokens and redirects to frontend.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        
        # If not authenticated via Django session, try strategy session
        if not user.is_authenticated:
            logger.warning("⚠️ User not in Django session, checking strategy session...")
            
            strategy = load_strategy(request)
            user_id = strategy.session_get('pending_user_id')
            
            if user_id:
                logger.info(f"✅ Found user_id {user_id} in strategy session")
                
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                try:
                    user = User.objects.get(pk=user_id)
                    
                    # Clean up strategy session
                    strategy.session_set('pending_user_id', None)
                    strategy.session_set('pending_user_email', None)
                    strategy.session_set('pending_user_first_name', None)
                    strategy.session_set('pending_user_last_name', None)
                    
                    logger.info(f"✅ Retrieved user from strategy session: {user.email}")
                    
                except User.DoesNotExist:
                    logger.error(f"❌ User {user_id} not found in database")
                    return redirect(f"{settings.FRONTEND_URL}/login?error=user_not_found")
            else:
                logger.error("❌ No user_id in strategy session")
                return redirect(f"{settings.FRONTEND_URL}/login?error=authentication_failed")

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        logger.info(f"✅ Tokens generated for: {user.email}")

        # Invalidate user's social accounts cache
        invalidate_user_social_cache(user.id)

        # Redirect to frontend with tokens
        params = urlencode({
            'access': access_token,
            'refresh': refresh_token,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })
        
        redirect_url = f"{settings.FRONTEND_URL}/social-login-success?{params}"
        logger.info(f"✅ Redirecting to: {redirect_url[:80]}...")
        
        return redirect(redirect_url)


class SocialAuthErrorView(APIView):
    """Called when OAuth login fails."""
    permission_classes = [AllowAny]

    def get(self, request):
        error = request.GET.get('error', 'unknown_error')
        logger.error(f"❌ Social auth error: {error}")
        return redirect(f"{settings.FRONTEND_URL}/login?error={error}")


class SocialAuthDisconnectView(APIView):
    """Called after user disconnects a social account."""
    permission_classes = [AllowAny]

    def get(self, request):
        return redirect(f"{settings.FRONTEND_URL}/settings?message=account_disconnected")


# Keep the rest of your views (SocialAuthProvidersView, UserSocialAccountsView) as they are