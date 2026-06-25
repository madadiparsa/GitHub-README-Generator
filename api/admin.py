# api/admin.py
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.admin import SocialAccountAdmin as AllauthSocialAccountAdmin
from .models import UserProfile, ReadmeTemplate


# ---------------------------------------------------------------------------
# Inline: show UserProfile fields directly on the User page
# ---------------------------------------------------------------------------
class UserProfileInline(admin.StackedInline):
    model               = UserProfile
    can_delete          = False
    verbose_name_plural = 'Profile'
    fk_name             = 'user'
    fields              = ('github_username', 'avatar_url', 'bio')
    extra               = 0


# ---------------------------------------------------------------------------
# Extend the default UserAdmin to embed the profile inline
# ---------------------------------------------------------------------------
class UserAdmin(BaseUserAdmin):
    inlines      = (UserProfileInline,)
    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'is_staff', 'date_joined', 'get_github_username',
    )
    list_filter   = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = (
        'username', 'email', 'first_name',
        'last_name', 'profile__github_username',
    )
    ordering = ('-date_joined',)

    @admin.display(description='GitHub Username')
    def get_github_username(self, obj):
        try:
            return obj.profile.github_username or '—'
        except UserProfile.DoesNotExist:
            return '—'


# ✅ Unregister default User admin and re-register with our extended version
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# ---------------------------------------------------------------------------
# UserProfile admin
# ---------------------------------------------------------------------------
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display    = ('user', 'github_username', 'avatar_url', 'bio')
    search_fields   = ('user__username', 'github_username')
    ordering        = ('user__username',)
    readonly_fields = ('user',)


# ---------------------------------------------------------------------------
# ReadmeTemplate admin
# ---------------------------------------------------------------------------
@admin.register(ReadmeTemplate)
class ReadmeTemplateAdmin(admin.ModelAdmin):
    list_display    = (
        'title', 'created_by', 'template_id', 'is_public',
        'fork_count', 'view_count', 'created_at',
    )
    list_filter     = ('is_public', 'template_id', 'created_at')
    search_fields   = ('title', 'created_by__username', 'slug')
    ordering        = ('-created_at',)
    readonly_fields = ('slug', 'fork_count', 'view_count', 'created_at', 'updated_at')

    fieldsets = (
        ('Template Info', {
            'fields': ('title', 'content', 'created_by', 'template_id'),
        }),
        ('Visibility', {
            'fields': ('is_public',),
        }),
        ('Stats', {
            'fields': ('slug', 'fork_count', 'view_count'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


# ---------------------------------------------------------------------------
# SocialAccount admin
# ✅ allauth already registers SocialAccount — unregister it first,
#    then subclass allauth's own admin so all its built-in
#    behaviour is preserved.
# ---------------------------------------------------------------------------
class SocialAccountAdmin(AllauthSocialAccountAdmin):
    list_display    = ('user', 'provider', 'uid', 'date_joined', 'last_login')
    list_filter     = ('provider',)
    search_fields   = ('user__username', 'uid')
    ordering        = ('-date_joined',)
    readonly_fields = ('user', 'provider', 'uid', 'date_joined', 'last_login', 'extra_data')

    def has_add_permission(self, request):
        return False


admin.site.unregister(SocialAccount)
admin.site.register(SocialAccount, SocialAccountAdmin)


# ---------------------------------------------------------------------------
# Admin site branding
# ---------------------------------------------------------------------------
admin.site.site_header = 'README Generator Admin'
admin.site.site_title  = 'README Gen'
admin.site.index_title = 'Dashboard'