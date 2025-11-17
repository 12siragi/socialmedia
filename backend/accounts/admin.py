from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    """Admin configuration for CustomUser model"""
    
    # Fields to display in the admin list view
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    
    # Fields that are clickable links in the list view
    list_display_links = ('email', 'username')
    
    # Fields to filter by in the right sidebar
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    
    # Fields to search by
    search_fields = ('email', 'username', 'first_name', 'last_name')
    
    # Fields to display in the form when editing a user
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'username')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields to display when adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )
    
    # Order users by email
    ordering = ('email',)

# Register the CustomUser model with the admin site
admin.site.register(CustomUser, CustomUserAdmin)
