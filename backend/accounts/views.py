# accounts/views.py
from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import RetrieveAPIView
from rest_framework.pagination import PageNumberPagination

from django.utils.http import urlsafe_base64_decode
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

from .models import CustomUser
from .serializers import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer
from .permissions import IsOwnerOrReadOnly
from .services.email_service import send_verification_email
from .services.tokens import account_activation_token

User = get_user_model()

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

        # ✅ Check if email was recently sent (rate limit)
        cache_key = f"verification_email_{user.email}"
        last_sent = cache.get(cache_key)
        
        if not last_sent:
            # Send verification email only if not recently sent
            send_verification_email(user)
            # ✅ Cache for 2 minutes to prevent duplicate sends
            cache.set(cache_key, timezone.now().isoformat(), timeout=120)

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
                # ✅ Clear rate limit cache on successful verification
                cache.delete(f"verification_email_{user.email}")
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

            # ✅ Rate limiting - Check if email was sent recently
            cache_key = f"verification_email_{user.email}"
            last_sent = cache.get(cache_key)
            
            if last_sent:
                # ✅ Calculate time remaining
                last_sent_time = timezone.datetime.fromisoformat(last_sent)
                time_diff = timezone.now() - last_sent_time
                wait_seconds = 120 - int(time_diff.total_seconds())
                
                if wait_seconds > 0:
                    return Response(
                        {
                            "detail": f"Please wait {wait_seconds} seconds before requesting another email.",
                            "retry_after": wait_seconds
                        }, 
                        status=status.HTTP_429_TOO_MANY_REQUESTS
                    )

            # ✅ Send email and cache timestamp
            send_verification_email(user)
            cache.set(cache_key, timezone.now().isoformat(), timeout=120)
            
            return Response(
                {"detail": "Verification email resent. Please check your inbox."}, 
                status=status.HTTP_200_OK
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