from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .tokens import account_activation_token


def send_verification_email(user):
    token = account_activation_token.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # ✅ CHANGE THIS - Use /api/auth/ instead of /api/accounts/
    verify_url = f"{settings.BACKEND_URL}/api/auth/verify-email/?uid={uid}&token={token}"
    
    subject = "Verify your PingChart email"
    message = f"""
    Hi {user.first_name},

    Please click the link below to verify your email:
    {verify_url}

    This link expires in 24 hours.
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )