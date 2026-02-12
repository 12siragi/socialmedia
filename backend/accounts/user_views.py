# accounts/user_views.py - User Profile & Account Management

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import transaction
import logging

from .serializers import (
    CustomUserSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    ChangeEmailSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)

# Cache timeout constants
USER_CACHE_TIMEOUT = 300  # 5 minutes


# ----------------------------
# Cache Helper Functions (reuse from views.py)
# ----------------------------
def get_user_cache_key(user_id):
    """Generate cache key for user object"""
    return f"user_obj:{user_id}"


def get_user_by_email_cache_key(email):
    """Generate cache key for email lookup"""
    return f"user_email:{email}"


def invalidate_user_cache(user):
    """Invalidate all cache entries for a user"""
    cache.delete(get_user_cache_key(user.id))
    cache.delete(get_user_by_email_cache_key(user.email))
    cache.delete_pattern("user_list:*")
    logger.debug(f"Cache invalidated for user {user.id}")


# ----------------------------
# Update Profile (Avatar, Name)
# ----------------------------
class UpdateProfileAPIView(generics.UpdateAPIView):
    """
    Update user profile: first_name, last_name, avatar
    
    PUT/PATCH /api/auth/profile/update/
    Body (multipart/form-data):
    {
        "first_name": "John",
        "last_name": "Doe",
        "avatar": <file>  # optional
    }
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateProfileSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
        """Save and invalidate cache"""
        user = serializer.save()
        invalidate_user_cache(user)
        logger.info(f"Profile updated for user {user.id}")
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            "detail": "Profile updated successfully.",
            "user": CustomUserSerializer(instance, context={"request": request}).data
        }, status=status.HTTP_200_OK)


# ----------------------------
# Change Password
# ----------------------------
class ChangePasswordAPIView(APIView):
    """
    Change user password (requires current password)
    
    POST /api/auth/password/change/
    Body:
    {
        "old_password": "current_password",
        "new_password": "new_secure_password"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Invalidate cache
            invalidate_user_cache(user)
            
            logger.info(f"Password changed for user {user.id}")
            
            return Response({
                "detail": "Password changed successfully. Please login again."
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# Change Email
# ----------------------------
class ChangeEmailAPIView(APIView):
    """
    Change user email (requires password confirmation)
    Sends verification email to new address
    
    POST /api/auth/email/change/
    Body:
    {
        "new_email": "newemail@example.com",
        "password": "current_password"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangeEmailSerializer(
            data=request.data,
            context={"request": request}
        )
        
        if serializer.is_valid():
            user = request.user
            new_email = serializer.validated_data['new_email']
            
            # Store old email for cache invalidation
            old_email = user.email
            
            with transaction.atomic():
                user.email = new_email
                user.is_email_verified = False  # Require re-verification
                user.save()
            
            # Invalidate old email cache and update new one
            cache.delete(get_user_by_email_cache_key(old_email))
            invalidate_user_cache(user)
            
            # Send verification email (import from views.py or tasks)
            from .tasks import send_verification_email_task
            send_verification_email_task.delay(user.id)
            
            logger.info(f"Email changed for user {user.id}: {old_email} → {new_email}")
            
            return Response({
                "detail": "Email updated. Verification email sent to new address.",
                "new_email": new_email
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# Delete Account
# ----------------------------
class DeleteAccountAPIView(APIView):
    """
    Permanently delete user account (requires password confirmation)
    
    DELETE /api/auth/account/delete/
    Body:
    {
        "password": "current_password",
        "confirm": "DELETE"  # Safety confirmation
    }
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        user = request.user
        password = request.data.get("password")
        confirm = request.data.get("confirm")
        
        # Validate password
        if not password:
            return Response({
                "detail": "Password is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(password):
            return Response({
                "detail": "Incorrect password."
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Require explicit confirmation
        if confirm != "DELETE":
            return Response({
                "detail": "Please confirm deletion by sending 'confirm': 'DELETE'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete user and all related data
        user_id = user.id
        user_email = user.email
        
        try:
            with transaction.atomic():
                # Invalidate cache before deletion
                invalidate_user_cache(user)
                
                # Delete avatar file if exists
                if user.avatar:
                    user.avatar.delete(save=False)
                
                # Delete user (will cascade to social accounts)
                user.delete()
            
            logger.warning(f"Account deleted: User {user_id} ({user_email})")
            
            return Response({
                "detail": "Account deleted successfully."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to delete account for user {user_id}: {str(e)}")
            return Response({
                "detail": "Failed to delete account. Please try again."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------------
# Get Connected Social Accounts
# ----------------------------
class ConnectedAccountsAPIView(APIView):
    """
    Get list of connected social accounts
    
    GET /api/auth/account/connected/
    Response:
    {
        "accounts": [
            {
                "provider": "google-oauth2",
                "uid": "123456789",
                "created": "2024-01-01T00:00:00Z"
            }
        ]
    }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all social accounts
        from social_django.models import UserSocialAuth
        
        social_accounts = UserSocialAuth.objects.filter(user=user).values(
            'provider', 'uid', 'created'
        )
        
        return Response({
            "accounts": list(social_accounts),
            "count": len(social_accounts)
        }, status=status.HTTP_200_OK)


# ----------------------------
# Account Settings Summary
# ----------------------------
class AccountSettingsAPIView(APIView):
    """
    Get account settings summary
    
    GET /api/auth/account/settings/
    Response:
    {
        "email": "user@example.com",
        "email_verified": true,
        "has_password": true,
        "connected_accounts": ["google-oauth2"],
        "date_joined": "2024-01-01T00:00:00Z"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Check if user has a password (or only social login)
        has_password = user.has_usable_password()
        
        # Get connected providers
        from social_django.models import UserSocialAuth
        connected_providers = list(
            UserSocialAuth.objects.filter(user=user).values_list('provider', flat=True)
        )
        
        return Response({
            "email": user.email,
            "email_verified": user.is_email_verified,
            "has_password": has_password,
            "connected_accounts": connected_providers,
            "date_joined": user.date_joined,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url
        }, status=status.HTTP_200_OK)