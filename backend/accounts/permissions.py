# accounts/permissions.py
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read-only for everyone
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        # Write permissions only for the owner
        return obj.id == request.user.id
