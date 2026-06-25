# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid


class UserProfile(models.Model):
    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    github_username = models.CharField(max_length=255, blank=True, null=True)
    avatar_url      = models.URLField(blank=True, null=True)
    bio             = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.user.username


# ✅ Auto-create a UserProfile whenever a new User is saved
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(user=instance)


class ReadmeTemplate(models.Model):
    """
    Stores both user-saved READMEs and publicly published gallery items.

    Fields added for gallery:
      - slug         : unique shareable identifier (used in preview URLs)
      - template_id  : which visual template was used (modern / minimalist / creative)
      - fork_count   : how many times this README has been forked into the editor
      - view_count   : how many times the public preview has been viewed
    """

    TEMPLATE_CHOICES = [
        ('modern',     'Modern Badges'),
        ('minimalist', 'Minimalist'),
        ('creative',   'Creative Banner'),
    ]

    title        = models.CharField(max_length=255)
    content      = models.TextField()
    created_by   = models.ForeignKey(
                       User,
                       on_delete=models.SET_NULL,
                       null=True,
                       blank=True,
                       related_name='readmes',
                   )
    is_public    = models.BooleanField(default=False)

    # ── Gallery fields ────────────────────────────────────────────────────
    slug         = models.SlugField(
                       max_length=64,
                       unique=True,
                       blank=True,
                       db_index=True,
                       help_text="Auto-generated unique identifier for shareable preview URLs.",
                   )
    template_id  = models.CharField(
                       max_length=32,
                       choices=TEMPLATE_CHOICES,
                       default='modern',
                   )
    fork_count   = models.PositiveIntegerField(default=0)
    view_count   = models.PositiveIntegerField(default=0)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-generate a unique slug if one hasn't been set yet
        if not self.slug:
            self.slug = str(uuid.uuid4()).replace('-', '')[:16]
            # Ensure uniqueness in the unlikely event of a collision
            while ReadmeTemplate.objects.filter(slug=self.slug).exists():
                self.slug = str(uuid.uuid4()).replace('-', '')[:16]
        super().save(*args, **kwargs)