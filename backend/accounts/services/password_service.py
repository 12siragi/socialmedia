# accounts/services/password_service.py

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.cache import cache
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


def check_password_reset_rate_limit(email):
    """Check rate limit for password reset"""
    user = User.objects.filter(email=email).first()
    if not user:
        return True, 0  # No user = allow (security: don't reveal)
    
    cache_key = f"password_reset_{user.id}"
    last_sent = cache.get(cache_key)
    
    if last_sent:
        cooldown_seconds = 300  # 5 minutes
        time_since_last = (timezone.now() - last_sent).total_seconds()
        
        if time_since_last < cooldown_seconds:
            remaining = int(cooldown_seconds - time_since_last)
            return False, remaining
    
    return True, 0


def send_password_reset_email_without_rate_limit(email, reset_url):
    """Send password reset email (called by Celery task)"""
    user = User.objects.filter(email=email).first()
    if not user:
        logger.warning(f"🔍 Password reset for non-existent email: {email}")
        return True, "Done"
    
    subject = "Reset your PingChart password"
    message = f"""
Hi,

You requested to reset your password. Click the link below:
{reset_url}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Thanks,
PingChart Team
    """
    
    try:
        logger.info(f"📧 Sending password reset email to: {email}")
        
        result = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        # Store rate limit
        cache_key = f"password_reset_{user.id}"
        cache.set(cache_key, timezone.now(), timeout=3600)
        
        logger.info(f"✅ Password reset email sent")
        return True, "Email sent"
        
    except Exception as e:
        logger.error(f"❌ Password reset email error: {str(e)}", exc_info=True)
        return False, str(e)


def generate_reset_token(email):
    """
    Generate reset token and return encoded uid + token.
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
    
    # Clear rate limit after successful reset
    cache_key = f"password_reset_{user.id}"
    cache.delete(cache_key)
    logger.info(f"🗑️ Cleared password reset rate limit for user {user.id}")
    
    logger.info(f"✅ Password reset successful for user: {user.email}")
    return True, "Password reset successful"