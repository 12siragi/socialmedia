# accounts/pipeline.py

"""
Custom pipeline functions for python-social-auth.

These integrate social login with your existing email authentication system.
"""

import logging

logger = logging.getLogger(__name__)


def associate_by_email(backend, details, user=None, *args, **kwargs):
    """
    Link social account to existing user if email matches.
    
    This allows users who already have an account with email/password
    to log in with social auth and automatically link the accounts.
    
    Flow:
    1. User registers with email/password → account created
    2. User later logs in with Google (same email) → this function links them
    3. Now user can log in with either method
    """
    if user:
        # User already exists, no need to check
        return {'user': user}

    email = details.get('email')
    if not email:
        # No email from provider, can't link
        logger.warning(f"No email provided by {backend.name}")
        return

    # Try to find existing user with this email
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        existing_user = User.objects.get(email=email)
        logger.info(f"✅ Linking {backend.name} account to existing user: {email}")
        return {'user': existing_user, 'is_new': False}
    except User.DoesNotExist:
        # No existing user, will be created by next pipeline step
        logger.info(f"🆕 New user will be created for: {email}")
        return


def mark_email_verified(backend, user, is_new=False, *args, **kwargs):
    """
    Mark email as verified for social login users.
    
    Since the user authenticated with Google/GitHub/Facebook,
    we trust that their email is valid and skip email verification.
    """
    if user and not user.is_email_verified:
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        logger.info(f"✅ Marked email verified for social user: {user.email}")
    
    return {'user': user}


def update_user_details(backend, user, response, *args, **kwargs):
    """
    Update user profile with data from social provider.
    
    This syncs the user's name and optionally avatar from their
    social media profile.
    
    Note: Only updates if fields are empty, doesn't overwrite existing data.
    """
    if not user:
        return

    # Update name if not set
    if backend.name == 'google-oauth2':
        first_name = response.get('given_name', '')
        last_name = response.get('family_name', '')
        
        if not user.first_name and first_name:
            user.first_name = first_name
        if not user.last_name and last_name:
            user.last_name = last_name
            
    elif backend.name == 'github':
        # GitHub provides full name as single string
        name = response.get('name', '')
        if name and not user.first_name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
                
    elif backend.name == 'facebook':
        first_name = response.get('first_name', '')
        last_name = response.get('last_name', '')
        
        if not user.first_name and first_name:
            user.first_name = first_name
        if not user.last_name and last_name:
            user.last_name = last_name
    
    # Save if any changes
    if user.has_usable_password() or user.first_name or user.last_name:
        user.save()
        logger.info(f"✅ Updated profile for {user.email} from {backend.name}")
    
    return {'user': user}