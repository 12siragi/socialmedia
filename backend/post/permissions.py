from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS = GET, HEAD, OPTIONS (anyone can read)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only the post author can update/delete
        return obj.author == request.user
