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


def mark_email_verified(backend, user, is_new=False, *args, **kwargs):
    """
    Mark email as verified for social login users.
    """
    if user and not user.is_email_verified:
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        
        invalidate_user_cache(user)
        
        logger.info(f"✅ Marked email verified for social user: {user.email}")
    
    return {'user': user}


def update_user_details(backend, user, response, *args, **kwargs):
    """
    Update user profile with data from social provider.
    """
    if not user:
        return

    updated = False
    fields_to_update = []

    if backend.name == 'google-oauth2':
        first_name = response.get('given_name', '')
        last_name = response.get('family_name', '')
        
        if not user.first_name and first_name:
            user.first_name = first_name
            fields_to_update.append('first_name')
            updated = True
            
        if not user.last_name and last_name:
            user.last_name = last_name
            fields_to_update.append('last_name')
            updated = True
            
    elif backend.name == 'github':
        name = response.get('name', '')
        if name and not user.first_name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            fields_to_update.append('first_name')
            updated = True
            
            if len(parts) > 1:
                user.last_name = parts[1]
                fields_to_update.append('last_name')
                
    elif backend.name == 'facebook':
        first_name = response.get('first_name', '')
        last_name = response.get('last_name', '')
        
        if not user.first_name and first_name:
            user.first_name = first_name
            fields_to_update.append('first_name')
            updated = True
            
        if not user.last_name and last_name:
            user.last_name = last_name
            fields_to_update.append('last_name')
            updated = True
    
    if updated and fields_to_update:
        user.save(update_fields=fields_to_update)
        invalidate_user_cache(user)
        logger.info(f"✅ Updated {', '.join(fields_to_update)} for {user.email} from {backend.name}")
    else:
        logger.debug(f"No updates needed for {user.email}")
    
    return {'user': user}


def authenticate_user(strategy, backend, user, request, *args, **kwargs):
    """
    Explicitly authenticate the user in the Django session.
    
    This ensures request.user.is_authenticated returns True
    in the SocialAuthSuccessView.
    
    CRITICAL: This must be the LAST step in the pipeline.
    
    PERFORMANCE: ~5ms (session write)
    """
    if user and request:
        # Log the user into the Django session
        login(
            request,
            user,
            backend='django.contrib.auth.backends.ModelBackend'
        )
        logger.info(f"✅ User {user.email} authenticated in session via {backend.name}")
    else:
        logger.error(f"❌ Failed to authenticate user in session - user: {user}, request: {request}")
    
    return {'user': user}