# accounts/services/email_service.py

from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.cache import cache  # ✅ This connects to Redis!
from django.utils import timezone
import logging

from .tokens import account_activation_token

logger = logging.getLogger(__name__)


def send_verification_email(user):
    """
    Send verification email with Redis-based rate limiting.
    
    ✅ REDIS WORKS IN THIS FUNCTION!
    
    Returns: (success: bool, message: str)
    """
    
    # ✅ REDIS STEP 1: Create unique key for this user
    cache_key = f"email_verification_{user.id}"
    
    # ✅ REDIS STEP 2: Check if email was recently sent
    last_sent = cache.get(cache_key)  # ← Queries Redis container
    
    if last_sent:
        # Calculate time since last email
        cooldown_seconds = 120  # 2 minutes
        time_since_last = (timezone.now() - last_sent).total_seconds()
        
        if time_since_last < cooldown_seconds:
            remaining = int(cooldown_seconds - time_since_last)
            logger.warning(f"⏱️ Rate limit hit for user {user.id}. {remaining}s remaining.")
            return False, f"Please wait {remaining} seconds before requesting another email."
    
    # Generate token and URL
    token = account_activation_token.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verify_url = f"{settings.BACKEND_URL}/api/auth/verify-email/?uid={uid}&token={token}"
    
    # Email content
    subject = "Verify your PingChart email"
    message = f"""
Hi {user.first_name},

Please click the link below to verify your email:
{verify_url}

This link expires in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
The PingChart Team
    """
    
    try:
        # Send email
        logger.info(f"📧 Sending verification email to: {user.email}")
        
        result = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        # ✅ REDIS STEP 3: Store timestamp to track when email was sent
        # This persists across all Docker containers!
        # timeout=86400 = 24 hours (same as token expiry)
        cache.set(cache_key, timezone.now(), timeout=86400)
        
        logger.info(f"✅ Verification email sent successfully. Result: {result}")
        logger.info(f"🔐 Stored rate limit in Redis: {cache_key}")
        
        return True, "Verification email sent successfully."
    
    except Exception as e:
        logger.error(f"❌ Failed to send verification email: {str(e)}", exc_info=True)
        return False, f"Failed to send email: {str(e)}"


def clear_verification_rate_limit(user):
    """
    Clear verification email rate limit for a user.
    Useful when email is successfully verified or for admin override.
    
    ✅ REDIS: Deletes the rate limit key
    """
    cache_key = f"email_verification_{user.id}"
    deleted = cache.delete(cache_key)  # ← Deletes from Redis
    logger.info(f"🗑️ Cleared verification rate limit for user {user.id}: {deleted}")
    return deleted


def get_verification_cooldown(user):
    """
    Get remaining cooldown time for verification email in seconds.
    
    ✅ REDIS: Reads from cache to check cooldown
    
    Returns: int (seconds remaining) or 0 if no cooldown
    """
    cache_key = f"email_verification_{user.id}"
    last_sent = cache.get(cache_key)  # ← Queries Redis
    
    if not last_sent:
        return 0
    
    cooldown_seconds = 120  # 2 minutes
    time_since_last = (timezone.now() - last_sent).total_seconds()
    remaining = max(0, cooldown_seconds - time_since_last)
    
    return int(remaining)