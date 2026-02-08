# accounts/views.py - WITH REDIS CACHING

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
from django.core.cache import cache
import logging

from .models import CustomUser
from .serializers import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer
from .permissions import IsOwnerOrReadOnly

from .tasks import send_verification_email_task, send_password_reset_email_task

# Import updated services with Redis rate limiting
from .services.email_service import (
    clear_verification_rate_limit,
    check_verification_rate_limit
)
from .services.tokens import account_activation_token
from .services.password_service import (
    generate_reset_token,
    reset_user_password,
    check_password_reset_rate_limit
)

User = get_user_model()
logger = logging.getLogger(__name__)

# Cache timeout constants (in seconds)
USER_CACHE_TIMEOUT = 300  # 5 minutes
USER_LIST_CACHE_TIMEOUT = 60  # 1 minute


# ----------------------------
# Cache Helper Functions
# ----------------------------
def get_user_cache_key(user_id):
    """Generate cache key for user object"""
    return f"user_obj:{user_id}"


def get_user_by_email_cache_key(email):
    """Generate cache key for email lookup"""
    return f"user_email:{email}"


def get_cached_user(user_id):
    """Get user from cache or DB"""
    cache_key = get_user_cache_key(user_id)
    user = cache.get(cache_key)
    
    if user is None:
        try:
            user = User.objects.get(pk=user_id)
            cache.set(cache_key, user, USER_CACHE_TIMEOUT)
            logger.debug(f"User {user_id} cached")
        except User.DoesNotExist:
            return None
    else:
        logger.debug(f"User {user_id} retrieved from cache")
    
    return user


def get_cached_user_by_email(email):
    """Get user by email from cache or DB"""
    cache_key = get_user_by_email_cache_key(email)
    user = cache.get(cache_key)
    
    if user is None:
        try:
            user = User.objects.get(email=email)
            # Cache both email lookup and user object
            cache.set(cache_key, user, USER_CACHE_TIMEOUT)
            cache.set(get_user_cache_key(user.id), user, USER_CACHE_TIMEOUT)
            logger.debug(f"User {email} cached")
        except User.DoesNotExist:
            return None
    else:
        logger.debug(f"User {email} retrieved from cache")
    
    return user


def invalidate_user_cache(user):
    """Invalidate all cache entries for a user"""
    cache.delete(get_user_cache_key(user.id))
    cache.delete(get_user_by_email_cache_key(user.email))
    logger.debug(f"Cache invalidated for user {user.id}")


# ----------------------------
# Registration
# ----------------------------
class UserRegistrationAPIView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(is_email_verified=False)

        # Cache the new user
        cache.set(get_user_cache_key(user.id), user, USER_CACHE_TIMEOUT)
        cache.set(get_user_by_email_cache_key(user.email), user, USER_CACHE_TIMEOUT)

        # Queue email task (non-blocking!)
        send_verification_email_task.delay(user.id)

        token = RefreshToken.for_user(user)
        data = CustomUserSerializer(user, context={"request": request}).data
        data["tokens"] = {
            "refresh": str(token),
            "access": str(token.access_token)
        }
        data["message"] = "User registered. Verification email sent."
        
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

        # Cache the user on successful login
        cache.set(get_user_cache_key(user.id), user, USER_CACHE_TIMEOUT)
        cache.set(get_user_by_email_cache_key(user.email), user, USER_CACHE_TIMEOUT)

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
            
            # Try cache first
            user = get_cached_user(uid)
            if user is None:
                return redirect(f"{settings.FRONTEND_URL}/email-verify-failed")
                
        except (TypeError, ValueError, OverflowError):
            return redirect(f"{settings.FRONTEND_URL}/email-verify-failed")

        if account_activation_token.check_token(user, token):
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()
                
                # Invalidate cache since user was updated
                invalidate_user_cache(user)
                
                # Clear rate limit after successful verification
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

        # Use cached user lookup
        user = get_cached_user_by_email(email)
        
        if user is None:
            return Response(
                {"detail": "User with this email does not exist."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.is_email_verified:
            return Response(
                {"detail": "Email is already verified."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check rate limit SYNCHRONOUSLY
        allowed, wait_time = check_verification_rate_limit(user)
        
        if not allowed:
            return Response(
                {"detail": f"Please wait {wait_time} seconds before requesting another email."}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Queue email task (non-blocking!)
        send_verification_email_task.delay(user.id)
        
        return Response(
            {"detail": "Verification email sent successfully."}, 
            status=status.HTTP_200_OK
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
        # Cache the current user's info
        user = self.request.user
        cache_key = get_user_cache_key(user.id)
        cached_user = cache.get(cache_key)
        
        if cached_user is None:
            # Refresh from DB
            user.refresh_from_db()
            cache.set(cache_key, user, USER_CACHE_TIMEOUT)
            logger.debug(f"User {user.id} info cached")
        else:
            user = cached_user
            logger.debug(f"User {user.id} info from cache")
        
        return user


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
        # Cache user lists for a shorter period
        cache_key = f"user_list:exclude_{self.request.user.id}"
        
        if self.action == "list":
            cached_queryset = cache.get(cache_key)
            
            if cached_queryset is None:
                queryset = CustomUser.objects.exclude(id=self.request.user.id)
                # Convert to list to cache (querysets can't be pickled)
                user_list = list(queryset)
                cache.set(cache_key, user_list, USER_LIST_CACHE_TIMEOUT)
                logger.debug("User list cached")
                return queryset
            else:
                logger.debug("User list from cache")
                # Return the cached list as is (pagination will handle it)
                return cached_queryset
        
        return CustomUser.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
    
    def perform_update(self, serializer):
        """Invalidate cache when user is updated"""
        user = serializer.save()
        invalidate_user_cache(user)
        # Invalidate user list cache
        cache.delete_pattern("user_list:*")
    
    def perform_destroy(self, instance):
        """Invalidate cache when user is deleted"""
        invalidate_user_cache(instance)
        cache.delete_pattern("user_list:*")
        instance.delete()


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

        # Check rate limit first
        allowed, wait_time = check_password_reset_rate_limit(email)
        if not allowed:
            return Response(
                {"detail": f"Please wait {wait_time} seconds before requesting another reset."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        uid, token = generate_reset_token(email)
        
        if uid and token:
            reset_url = f"{settings.BACKEND_URL}/api/auth/password-reset-confirm/?uid={uid}&token={token}"
            
            # Queue email task (non-blocking!)
            send_password_reset_email_task.delay(email, reset_url)
        
        # Don't reveal whether email exists (security best practice)
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

        # Validates and updates password
        success, message = reset_user_password(uid, token, password)

        if success:
            # Invalidate user cache since password changed
            try:
                user_pk = force_str(urlsafe_base64_decode(uid))
                user = get_cached_user(user_pk)
                if user:
                    invalidate_user_cache(user)
            except Exception as e:
                logger.error(f"Failed to invalidate cache after password reset: {e}")

        return Response(
            {"detail": message},
            status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
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
            
            # Try cached user first
            user = get_cached_user(user_pk)
            if user is None:
                logger.warning(f"❌ User not found: {user_pk}")
                return redirect(f"{settings.FRONTEND_URL}/reset-password-failed/")
            
            if token_generator.check_token(user, token):
                logger.info(f"✅ Valid token for user: {user.email}")
                return redirect(f"{settings.FRONTEND_URL}/reset-password/?uid={uid}&token={token}")
            else:
                logger.warning(f"❌ Invalid/expired token for user: {user.email}")
                return redirect(f"{settings.FRONTEND_URL}/reset-password-failed/")
                
        except (TypeError, ValueError, OverflowError) as e:
            logger.error(f"❌ Validation error: {str(e)}")
            return redirect(f"{settings.FRONTEND_URL}/reset-password-failed/")