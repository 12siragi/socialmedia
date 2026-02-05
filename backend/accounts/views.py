# accounts/views.py - SIMPLIFIED VERSION

from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth import get_user_model
import logging

from .models import CustomUser
from .serializers import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer
from .permissions import IsOwnerOrReadOnly

# ✅ Import updated services with Redis rate limiting
from .services.email_service import (
    send_verification_email,
    clear_verification_rate_limit
)
from .services.tokens import account_activation_token
from .services.password_service import (
    generate_reset_token,
    reset_user_password,
    send_password_reset_email
)

User = get_user_model()
logger = logging.getLogger(__name__)


# ----------------------------
# Registration
# ----------------------------
class UserRegistrationAPIView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create user (active, but not verified)
        user = serializer.save(is_email_verified=False)

        # ✅ SIMPLIFIED: Redis rate limiting is inside the function now!
        success, message = send_verification_email(user)
        
        if not success:
            logger.warning(f"Failed to send verification email: {message}")

        # Generate tokens
        token = RefreshToken.for_user(user)
        data = CustomUserSerializer(user, context={"request": request}).data
        data["tokens"] = {
            "refresh": str(token),
            "access": str(token.access_token)
        }
        data["message"] = "User registered. Please check your email to verify your account."
        
        return Response(data, status=status.HTTP_201_CREATED)


# ----------------------------
# Login
# ----------------------------
class UserLoginAPIView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data

        if not user.is_email_verified:
            return Response(
                {"detail": "Please verify your email before logging in."},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = RefreshToken.for_user(user)
        data = CustomUserSerializer(user, context={"request": request}).data
        data["tokens"] = {
            "refresh": str(token),
            "access": str(token.access_token)
        }
        return Response(data, status=status.HTTP_200_OK)


# ----------------------------
# Email Verification
# ----------------------------
class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        uidb64 = request.GET.get("uid")
        token = request.GET.get("token")

        if not uidb64 or not token:
            return redirect(f"{settings.FRONTEND_URL}/email-verify-failed")

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return redirect(f"{settings.FRONTEND_URL}/email-verify-failed")

        if account_activation_token.check_token(user, token):
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()
                
                # ✅ SIMPLIFIED: Clear rate limit after successful verification
                clear_verification_rate_limit(user)
                
            return redirect(f"{settings.FRONTEND_URL}/email-verified-success")
        else:
            return redirect(f"{settings.FRONTEND_URL}/email-verify-failed")


# ----------------------------
# Resend Verification Email
# ----------------------------
class ResendVerificationEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "Email is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            
            if user.is_email_verified:
                return Response(
                    {"detail": "Email is already verified."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ SIMPLIFIED: All Redis logic is in the service function!
            # No more manual cache.get() / cache.set() in the view
            success, message = send_verification_email(user)
            
            if success:
                return Response(
                    {"detail": message}, 
                    status=status.HTTP_200_OK
                )
            else:
                # Extract wait time from message if rate limited
                # Message format: "Please wait X seconds..."
                return Response(
                    {"detail": message}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User with this email does not exist."}, 
                status=status.HTTP_404_NOT_FOUND
            )


# ----------------------------
# Logout
# ----------------------------
class UserLogoutAPIView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST
            )


# ----------------------------
# User Info
# ----------------------------
class UserInfoAPIView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user


# ----------------------------
# Pagination & User ViewSet
# ----------------------------
class SmallPagination(PageNumberPagination):
    page_size = 5


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    pagination_class = SmallPagination

    def get_queryset(self):
        if self.action == "list":
            return CustomUser.objects.exclude(id=self.request.user.id)
        return CustomUser.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    
# ----------------------------
# Forgot Password
# ----------------------------
class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ SIMPLIFIED: Generate token and send email with rate limiting
        uid, token = generate_reset_token(email)
        
        if uid and token:
            reset_url = f"{settings.BACKEND_URL}/api/auth/password-reset-confirm/?uid={uid}&token={token}"
            
            # ✅ Redis rate limiting happens inside this function!
            success, message = send_password_reset_email(email, reset_url)
            
            if not success:
                # Rate limited
                return Response(
                    {"detail": message},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        # Always return generic message (security)
        return Response(
            {"detail": "If the email exists, a reset link has been sent."},
            status=status.HTTP_200_OK
        )


# ----------------------------
# Reset Password
# ----------------------------
class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")

        if not all([uid, token, password]):
            return Response(
                {"detail": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ No Redis here - just validates and updates password
        success, message = reset_user_password(uid, token, password)

        if not success:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"detail": message},
            status=status.HTTP_200_OK
        )


# ----------------------------
# Password Reset Confirm (Email Link)
# ----------------------------
class PasswordResetConfirmAPIView(APIView):
    """
    Backend redirect for password reset:
    1. User clicks email link → comes here
    2. Backend validates token
    3. If valid → redirects to frontend with uid & token
    4. If invalid → redirects to error page
    
    ✅ No Redis here - just validates tokens
    """
    permission_classes = [AllowAny]

    def get(self, request):
        uid = request.GET.get("uid")
        token = request.GET.get("token")

        logger.info(f"🔐 Password reset link clicked - UID: {uid}")

        if not uid or not token:
            logger.warning("❌ Missing uid or token")
            return redirect(f"{settings.FRONTEND_URL}/reset-password-failed/")

        try:
            from .services.password_service import token_generator
            
            # Decode and validate
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
            
            if token_generator.check_token(user, token):
                logger.info(f"✅ Valid token for user: {user.email}")
                return redirect(f"{settings.FRONTEND_URL}/reset-password/?uid={uid}&token={token}")
            else:
                logger.warning(f"❌ Invalid/expired token for user: {user.email}")
                return redirect(f"{settings.FRONTEND_URL}/reset-password-failed/")
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            logger.error(f"❌ Validation error: {str(e)}")
            return redirect(f"{settings.FRONTEND_URL}/reset-password-failed/")