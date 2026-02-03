# accounts/views.py
from rest_framework import viewsets, status, generics
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView

from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model

from .models import CustomUser
from .serializers import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer
from .permissions import IsOwnerOrReadOnly
from accounts.services.email_service import send_verification_email
from accounts.services.tokens import account_activation_token


User = get_user_model()


# ----------------------------
# Auth Views
# ----------------------------

# accounts/views.py
class UserRegistrationAPIView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user inactive
        user = serializer.save(is_active=False, is_email_verified=False)

        # Send verification email
        send_verification_email(user)

        token = RefreshToken.for_user(user)
        data = CustomUserSerializer(user, context={"request": request}).data
        data["tokens"] = {
            "refresh": str(token),
            "access": str(token.access_token)
        }
        data["message"] = "User registered. Please check your email to verify your account."
        return Response(data, status=status.HTTP_201_CREATED)


class UserLoginAPIView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data

        # Prevent login if email not verified
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


class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        uidb64 = request.GET.get("uid")
        token = request.GET.get("token")

        if not uidb64 or not token:
            return Response({"detail": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST)

        if account_activation_token.check_token(user, token):
            if user.is_email_verified:
                return Response({"detail": "Email already verified."}, status=status.HTTP_200_OK)

            user.is_email_verified = True
            user.save()
            return Response({"detail": "Email verified successfully!"}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Activation link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# Logout / Info / User CRUD
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


class UserInfoAPIView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user


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
