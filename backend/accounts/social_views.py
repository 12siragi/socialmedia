from django.shortcuts import redirect
from django.conf import settings
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
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
    
    Retrieves user from Redis cache using token stored in session.
    Generates JWT tokens and redirects to frontend.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        
        # If not authenticated via Django session, try cache token method
        if not user.is_authenticated:
            logger.warning("⚠️ User not in Django session, checking cache token...")
            
            # Debug: Log session info
            logger.error(f"🔍 Session key: {request.session.session_key}")
            logger.error(f"🔍 Session keys: {list(request.session.keys())}")
            logger.error(f"🔍 Session items: {dict(request.session.items())}")
            
            # Try to get token from session
            token = request.session.get('social_auth_token')
            
            if token:
                logger.info(f"✅ Found token in session: {token[:16]}...")
                
                # Retrieve user data from cache using token
                cache_key = f'social_auth_pending:{token}'
                user_data = cache.get(cache_key)
                
                if user_data:
                    logger.info(f"✅ Found user data in cache for user_id: {user_data.get('user_id')}")
                    
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    
                    try:
                        user = User.objects.get(pk=user_data['user_id'])
                        
                        # Clean up (one-time use token)
                        cache.delete(cache_key)
                        if 'social_auth_token' in request.session:
                            del request.session['social_auth_token']
                            request.session.save()
                        
                        logger.info(f"✅ Retrieved user from cache: {user.email}")
                        
                    except User.DoesNotExist:
                        logger.error(f"❌ User {user_data['user_id']} not found in database")
                        return redirect(f"{settings.FRONTEND_URL}/login?error=user_not_found")
                else:
                    logger.error(f"❌ No user data found in cache for token {token[:16]}... (expired or used)")
                    
                    # Debug: Check if key exists in Redis
                    logger.error(f"🔍 Checking Redis for key: {cache_key}")
                    all_keys = cache.keys('social_auth_pending:*') if hasattr(cache, 'keys') else 'N/A'
                    logger.error(f"🔍 All social_auth_pending keys in Redis: {all_keys}")
                    
                    return redirect(f"{settings.FRONTEND_URL}/login?error=token_expired")
            else:
                logger.error("❌ No token found in session")
                
                # Debug: Check Redis directly for any pending tokens
                logger.error("🔍 Checking all pending tokens in Redis...")
                try:
                    import redis
                    r = redis.Redis(host='redis', port=6379, db=1)
                    keys = r.keys('social_auth_pending:*')
                    logger.error(f"🔍 Found {len(keys)} pending tokens in Redis: {keys}")
                    if keys:
                        for key in keys[:3]:  # Show first 3
                            val = r.get(key)
                            logger.error(f"🔍 Key: {key}, Value: {val}")
                except Exception as e:
                    logger.error(f"🔍 Redis debug error: {e}")
                
                return redirect(f"{settings.FRONTEND_URL}/login?error=authentication_failed")

        # Generate JWT tokens (this code runs for both authenticated and newly retrieved users)
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