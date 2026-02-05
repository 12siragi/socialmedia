from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import logging

logger = logging.getLogger(__name__)

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


def send_password_reset_email(email, reset_url):
    """Send password reset email"""
    try:
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
        
        logger.info(f"📧 Sending password reset email to: {email}")
        
        result = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        logger.info(f"✅ Password reset email sent successfully. Result: {result}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email: {str(e)}", exc_info=True)
        raise


def generate_reset_token(email):
    """Generate reset token and return encoded uid + token"""
    user = User.objects.filter(email=email).first()
    if not user:
        return None, None

    token = token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    return uid, token


def reset_user_password(uid, token, new_password):
    """Reset password using uid and token"""
    try:
        user_pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return False, "Invalid reset link"

    if not token_generator.check_token(user, token):
        return False, "Invalid or expired token"

    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return False, ', '.join(e.messages)

    user.set_password(new_password)
    user.save()
    
    logger.info(f"✅ Password reset successful for user: {user.email}")
    return True, "Password reset successful"