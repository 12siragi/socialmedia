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
            
            # Debug: Session info (safe version)
            try:
                session_key = request.session.session_key
                logger.error(f"🔍 View session key: {session_key}")
            except Exception as e:
                logger.error(f"🔍 View session error: {e}")
            
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
                        try:
                            if 'social_auth_token' in request.session:
                                del request.session['social_auth_token']
                                request.session.save()
                        except:
                            pass
                        
                        logger.info(f"✅ Retrieved user from cache: {user.email}")
                        
                    except User.DoesNotExist:
                        logger.error(f"❌ User {user_data['user_id']} not found in database")
                        return redirect(f"{settings.FRONTEND_URL}/login?error=user_not_found")
                else:
                    logger.error(f"❌ No user data found in cache for token")
                    
                    # Debug: Check Redis
                    try:
                        import redis
                        r = redis.Redis(host='redis', port=6379, db=1)
                        all_keys = r.keys('social_auth_pending:*')
                        logger.error(f"🔍 Redis has {len(all_keys)} pending tokens")
                    except:
                        pass
                    
                    return redirect(f"{settings.FRONTEND_URL}/login?error=token_expired")
            else:
                logger.error("❌ No token found in session")
                
                # Debug: Check Redis for any tokens
                try:
                    import redis
                    r = redis.Redis(host='redis', port=6379, db=1)
                    keys = r.keys('social_auth_pending:*')
                    logger.error(f"🔍 Found {len(keys)} pending tokens in Redis")
                    if keys and len(keys) > 0:
                        logger.error(f"🔍 First key: {keys[0]}")
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
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = get_providers_cache_key()
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.debug("Cache HIT: Providers list from cache")
            return Response(cached_data)
        
        # Cache MISS - build providers list
        logger.debug("Cache MISS: Building providers list")
        providers = []
        
        if getattr(settings, 'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY', None):
            providers.append({
                'name': 'google-oauth2',
                'display_name': 'Google',
                'login_url': '/api/auth/social/login/google-oauth2/',
                'icon': 'google'
            })
        
        if getattr(settings, 'SOCIAL_AUTH_GITHUB_KEY', None):
            providers.append({
                'name': 'github',
                'display_name': 'GitHub',
                'login_url': '/api/auth/social/login/github/',
                'icon': 'github'
            })
        
        if getattr(settings, 'SOCIAL_AUTH_FACEBOOK_KEY', None):
            providers.append({
                'name': 'facebook',
                'display_name': 'Facebook',
                'login_url': '/api/auth/social/login/facebook/',
                'icon': 'facebook'
            })
        
        response_data = {
            'providers': providers,
            'count': len(providers)
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, response_data, PROVIDERS_CACHE_TIMEOUT)
        logger.debug(f"Cached {len(providers)} providers for {PROVIDERS_CACHE_TIMEOUT}s")
        
        return Response(response_data)


class UserSocialAccountsView(APIView):
    """
    Get user's connected social accounts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        cache_key = get_user_social_accounts_cache_key(user.id)
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.debug(f"Cache HIT: Social accounts for user {user.id}")
            return Response(cached_data)
        
        # Cache MISS - fetch from DB
        logger.debug(f"Cache MISS: Fetching social accounts for user {user.id}")
        
        from social_django.models import UserSocialAuth
        
        social_accounts = UserSocialAuth.objects.filter(
            user=user
        ).select_related('user').only('provider', 'uid', 'created', 'extra_data')
        
        accounts = []
        for account in social_accounts:
            extra_data = account.extra_data or {}
            
            accounts.append({
                'provider': account.provider,
                'uid': account.uid,
                'created': account.created.isoformat() if account.created else None,
                'email': extra_data.get('email', ''),
                'name': extra_data.get('name', ''),
            })
        
        response_data = {
            'social_accounts': accounts,
            'count': len(accounts)
        }
        
        cache.set(cache_key, response_data, USER_SOCIAL_ACCOUNTS_CACHE_TIMEOUT)
        logger.debug(f"Cached {len(accounts)} social accounts for user {user.id}")
        
        return Response(response_data)

    def delete(self, request):
        """Disconnect a social account."""
        provider = request.data.get('provider')
        
        if not provider:
            return Response(
                {'detail': 'Provider is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        from social_django.models import UserSocialAuth
        
        try:
            social_account = UserSocialAuth.objects.select_related('user').get(
                user=user,
                provider=provider
            )
            
            has_password = user.has_usable_password()
            other_socials = UserSocialAuth.objects.filter(user=user).exclude(provider=provider).exists()
            
            if not has_password and not other_socials:
                return Response(
                    {'detail': 'Cannot disconnect last login method. Set a password first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            social_account.delete()
            invalidate_user_social_cache(user.id)
            
            logger.info(f"✅ Disconnected {provider} for user: {user.email}")
            
            return Response({
                'detail': f'{provider} account disconnected successfully',
                'provider': provider
            })
            
        except UserSocialAuth.DoesNotExist:
            return Response(
                {'detail': f'No {provider} account found'},
                status=status.HTTP_404_NOT_FOUND
            )