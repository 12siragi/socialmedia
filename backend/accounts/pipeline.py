# accounts/pipeline.py

import logging
from django.core.cache import cache
from django.contrib.auth import login

logger = logging.getLogger(__name__)

USER_CACHE_TIMEOUT = 300  # 5 minutes


def get_user_by_email_cache_key(email):
    """Generate cache key for email-based user lookup"""
    return f"user_email:{email}"


def get_user_cache_key(user_id):
    """Generate cache key for user object"""
    return f"user_obj:{user_id}"


def invalidate_user_cache(user):
    """Invalidate all cache entries for a user"""
    cache.delete(get_user_cache_key(user.id))
    cache.delete(get_user_by_email_cache_key(user.email))
    logger.debug(f"Cache invalidated for user {user.id}")

def authenticate_user(strategy, backend, user, request, *args, **kwargs):
    """
    Store user ID in Redis cache with a unique token.
    Token will be retrieved after redirect.
    """
    try:
        logger.error(f"🔵 authenticate_user STARTED - user: {user}, request: {bool(request)}")
        
        if user and request:
            import secrets
            
            # Generate unique secure token
            token = secrets.token_urlsafe(32)
            
            # Store user info in Redis cache for 60 seconds
            cache_key = f'social_auth_pending:{token}'
            user_data = {
                'user_id': user.pk,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
            cache.set(cache_key, user_data, 60)
            
            # Debug: Verify cache
            try:
                verify = cache.get(cache_key)
                logger.error(f"🔍 Cache verified: user_id={verify.get('user_id') if verify else 'NONE'}")
            except Exception as e:
                logger.error(f"🔍 Cache verify error: {e}")
            
            # Debug: Session info
            try:
                session_key = request.session.session_key
                logger.error(f"🔍 Session key: {session_key}")
            except Exception as e:
                logger.error(f"🔍 Session key error: {e}")
            
            # Store token in session
            request.session['social_auth_token'] = token
            request.session.modified = True
            
            try:
                request.session.save()
                logger.error(f"🔍 Session saved successfully")
            except Exception as e:
                logger.error(f"🔍 Session save error: {e}")
            
            # Verify token was stored
            try:
                stored_token = request.session.get('social_auth_token')
                if stored_token:
                    logger.error(f"🔍 Token in session: {stored_token[:16]}...")
                else:
                    logger.error(f"🔍 Token NOT in session!")
            except Exception as e:
                logger.error(f"🔍 Token verify error: {e}")
            
            logger.error(f"✅ Stored user {user.pk} in cache with token")
        else:
            logger.error(f"❌ Failed to store user - user: {user}, request: {bool(request)}")
        
        return {'user': user}
        
    except Exception as e:
        logger.error(f"❌ EXCEPTION in authenticate_user: {e}", exc_info=True)
        raise