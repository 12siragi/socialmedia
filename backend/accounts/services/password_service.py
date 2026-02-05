# accounts/services/password_service.py

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.cache import cache  # ✅ This connects to Redis!
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


def send_password_reset_email(email, reset_url):
    """
    Send password reset email with Redis-based rate limiting.
    
    ✅ REDIS WORKS IN THIS FUNCTION!
    
    Returns: (success: bool, message: str)
    """
    # Get user
    user = User.objects.filter(email=email).first()
    if not user:
        # Don't reveal if user exists (security)
        logger.warning(f"🔍 Password reset requested for non-existent email: {email}")
        return True, "If an account exists, a password reset email has been sent."
    
    # ✅ REDIS STEP 1: Create unique key for this user
    cache_key = f"password_reset_{user.id}"
    
    # ✅ REDIS STEP 2: Check if reset email was recently sent
    last_sent = cache.get(cache_key)  # ← Queries Redis container
    
    if last_sent:
        # Calculate time since last email
        cooldown_seconds = 300  # 5 minutes (more restrictive for password resets)
        time_since_last = (timezone.now() - last_sent).total_seconds()
        
        if time_since_last < cooldown_seconds:
            remaining = int(cooldown_seconds - time_since_last)
            logger.warning(f"⏱️ Password reset rate limit hit for user {user.id}. {remaining}s remaining.")
            return False, f"Please wait {remaining} seconds before requesting another password reset."
    
    # Email content
    subject = "Reset your PingChart password"
    message = f"""
Hi,

You requested to reset your password. Click the link below to create a new password:
{reset_url}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Thanks,
PingChart Team
    """
    
    try:
        logger.info(f"📧 Sending password reset email to: {email}")
        
        result = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        # ✅ REDIS STEP 3: Store timestamp (expires in 1 hour)
        # This persists across all Docker containers!
        cache.set(cache_key, timezone.now(), timeout=3600)  # 1 hour
        
        logger.info(f"✅ Password reset email sent successfully. Result: {result}")
        logger.info(f"🔐 Stored rate limit in Redis: {cache_key}")
        
        # Return generic message (security - don't reveal if user exists)
        return True, "If an account exists, a password reset email has been sent."
        
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email: {str(e)}", exc_info=True)
        return False, f"Failed to send email: {str(e)}"


def generate_reset_token(email):
    """
    Generate reset token and return encoded uid + token.
    
    ✅ NO REDIS HERE - This just generates tokens
    
    Returns: (uid, token) or (None, None) if user not found
    """
    user = User.objects.filter(email=email).first()
    if not user:
        logger.warning(f"🔍 Token generation requested for non-existent email: {email}")
        return None, None

    token = token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    logger.info(f"🔑 Generated reset token for user: {email}")
    return uid, token


def reset_user_password(uid, token, new_password):
    """
    Reset password using uid and token.
    
    ✅ NO REDIS HERE - This just validates and updates password
    
    Returns: (success: bool, message: str)
    """
    try:
        user_pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        logger.warning(f"❌ Invalid reset link - uid: {uid}")
        return False, "Invalid reset link"

    if not token_generator.check_token(user, token):
        logger.warning(f"❌ Invalid or expired token for user: {user.email}")
        return False, "Invalid or expired token"

    try:
        validate_password(new_password, user)
    except ValidationError as e:
        logger.warning(f"❌ Weak password for user: {user.email}")
        return False, ', '.join(e.messages)

    user.set_password(new_password)
    user.save()
    
    # ✅ OPTIONAL: Clear rate limit after successful reset
    cache_key = f"password_reset_{user.id}"
    cache.delete(cache_key)  # ← Deletes from Redis
    logger.info(f"🗑️ Cleared password reset rate limit for user {user.id}")
    
    logger.info(f"✅ Password reset successful for user: {user.email}")
    return True, "Password reset successful"


def get_reset_cooldown(user_id):
    """
    Get remaining cooldown time for password reset in seconds.
    
    ✅ REDIS: Reads from cache to check cooldown
    
    Returns: int (seconds remaining) or 0 if no cooldown
    """
    cache_key = f"password_reset_{user_id}"
    last_sent = cache.get(cache_key)  # ← Queries Redis
    
    if not last_sent:
        return 0
    
    cooldown_seconds = 300  # 5 minutes
    time_since_last = (timezone.now() - last_sent).total_seconds()
    remaining = max(0, cooldown_seconds - time_since_last)
    
    return int(remaining)