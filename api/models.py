# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    github_username = models.CharField(max_length=255, blank=True, null=True)
    avatar_url     = models.URLField(blank=True, null=True)
    bio            = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.user.username


# ✅ Fix: automatically create a UserProfile whenever a new User is saved.
#    Without this, any code that does `user.profile` raises
#    RelatedObjectDoesNotExist for users created via OAuth.
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Guard against the profile not existing (e.g. legacy users)
    UserProfile.objects.get_or_create(user=instance)


class ReadmeTemplate(models.Model):
    title      = models.CharField(max_length=255)
    content    = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_public  = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title