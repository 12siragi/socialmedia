# accounts/tasks.py (NEW FILE)
from celery import shared_task
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email_task(self, user_id):
    """
    Async task to send verification email.
    Retries 3 times if it fails.
    """
    try:
        user = User.objects.get(pk=user_id)
        
        # Import here to avoid circular imports
        from .services.email_service import send_verification_email_without_rate_limit
        
        success, message = send_verification_email_without_rate_limit(user)
        
        if not success:
            logger.warning(f"❌ Verification email failed for user {user_id}: {message}")
            # Don't retry on rate limit errors
            if "wait" in message.lower():
                return False
            # Retry on other errors
            raise Exception(message)
            
        logger.info(f"✅ Verification email sent for user {user_id}")
        return True
        
    except User.DoesNotExist:
        logger.error(f"❌ User {user_id} not found")
        return False
        
    except Exception as exc:
        logger.error(f"❌ Email task error: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email_task(self, email, reset_url):
    """
    Async task to send password reset email.
    """
    try:
        from .services.password_service import send_password_reset_email_without_rate_limit
        
        success, message = send_password_reset_email_without_rate_limit(email, reset_url)
        
        if not success:
            logger.warning(f"❌ Password reset email failed for {email}: {message}")
            if "wait" in message.lower():
                return False
            raise Exception(message)
            
        logger.info(f"✅ Password reset email sent to {email}")
        return True
        
    except Exception as exc:
        logger.error(f"❌ Password reset email error: {exc}")
        raise self.retry(exc=exc)