# accounts/services/email_service.py

from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.cache import cache
from django.utils import timezone
import logging

from .tokens import account_activation_token

logger = logging.getLogger(__name__)


def check_verification_rate_limit(user):
    """
    Check rate limit ONLY - doesn't send email.
    Returns: (allowed: bool, wait_time: int)
    """
    cache_key = f"email_verification_{user.id}"
    last_sent = cache.get(cache_key)
    
    if last_sent:
        cooldown_seconds = 120  # 2 minutes
        time_since_last = (timezone.now() - last_sent).total_seconds()
        
        if time_since_last < cooldown_seconds:
            remaining = int(cooldown_seconds - time_since_last)
            return False, remaining
    
    return True, 0


def send_verification_email_without_rate_limit(user):
    """
    Send email WITHOUT checking rate limit (for Celery tasks).
    Rate limit is checked BEFORE queuing the task.
    """
    # Generate token and URL
    token = account_activation_token.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verify_url = f"{settings.BACKEND_URL}/api/auth/verify-email/?uid={uid}&token={token}"
    
    subject = "Verify your PingChart email"
    message = f"""
Hi {user.first_name or 'there'},

Please click the link below to verify your email:
{verify_url}

This link expires in 24 hours.

Best regards,
The PingChart Team
    """
    
    try:
        logger.info(f"📧 Sending verification email to: {user.email}")
        
        result = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        # Store rate limit timestamp
        cache_key = f"email_verification_{user.id}"
        cache.set(cache_key, timezone.now(), timeout=86400)
        
        logger.info(f"✅ Verification email sent successfully")
        return True, "Verification email sent successfully."
        
    except Exception as e:
        logger.error(f"❌ Failed to send verification email: {str(e)}", exc_info=True)
        return False, f"Failed to send email: {str(e)}"


def clear_verification_rate_limit(user):
    """
    Clear verification email rate limit for a user.
    Called after successful email verification.
    """
    cache_key = f"email_verification_{user.id}"
    deleted = cache.delete(cache_key)
    logger.info(f"🗑️ Cleared verification rate limit for user {user.id}: {deleted}")
    return deleted