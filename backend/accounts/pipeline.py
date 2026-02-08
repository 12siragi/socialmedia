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


def associate_by_email(backend, details, user=None, *args, **kwargs):
    """
    Link social account to existing user if email matches.
    """
    try:
        logger.error(f"🔵 associate_by_email STARTED - user: {user}, email: {details.get('email')}")
        
        if user:
            logger.debug(f"User already authenticated: {user.email}")
            return {'user': user}

        email = details.get('email')
        if not email:
            logger.warning(f"No email provided by {backend.name}")
            return

        # Try cache first
        cache_key = get_user_by_email_cache_key(email)
        existing_user = cache.get(cache_key)
        
        if existing_user is None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            try:
                existing_user = User.objects.get(email=email)
                
                cache.set(cache_key, existing_user, USER_CACHE_TIMEOUT)
                cache.set(get_user_cache_key(existing_user.id), existing_user, USER_CACHE_TIMEOUT)
                
                logger.info(f"✅ Linking {backend.name} account to existing user: {email}")
                return {'user': existing_user, 'is_new': False}
                
            except User.DoesNotExist:
                logger.info(f"🆕 New user will be created for: {email}")
                return
        else:
            logger.debug(f"Cache HIT: Found existing user for {email}")
            logger.info(f"✅ Linking {backend.name} account to existing user: {email}")
            return {'user': existing_user, 'is_new': False}
            
    except Exception as e:
        logger.error(f"❌ EXCEPTION in associate_by_email: {e}", exc_info=True)
        raise


def mark_email_verified(backend, user, is_new=False, *args, **kwargs):
    """
    Mark email as verified for social login users.
    """
    try:
        logger.error(f"🔵 mark_email_verified STARTED - user: {user}")
        
        if user and not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
            
            invalidate_user_cache(user)
            
            logger.info(f"✅ Marked email verified for social user: {user.email}")
        
        return {'user': user}
        
    except Exception as e:
        logger.error(f"❌ EXCEPTION in mark_email_verified: {e}", exc_info=True)
        raise


def authenticate_user(strategy, backend, user, request, *args, **kwargs):
    """
    Explicitly authenticate the user in the Django session.
    """
    try:
        logger.error(f"🔵 authenticate_user STARTED - user: {user}, request: {bool(request)}")
        
        if user and request:
            login(
                request,
                user,
                backend='django.contrib.auth.backends.ModelBackend'
            )
            logger.info(f"✅ User {user.email} authenticated in session via {backend.name}")
        else:
            logger.error(f"❌ Failed to authenticate user in session - user: {user}, request: {request}")
        
        return {'user': user}
        
    except Exception as e:
        logger.error(f"❌ EXCEPTION in authenticate_user: {e}", exc_info=True)
        raise