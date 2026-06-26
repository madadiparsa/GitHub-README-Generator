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


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(user=instance)


class ReadmeTemplate(models.Model):
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
    slug         = models.SlugField(
                       max_length=64,
                       unique=True,
                       blank=True,
                       db_index=True,
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
        if not self.slug:
            self.slug = str(uuid.uuid4()).replace('-', '')[:16]
            while ReadmeTemplate.objects.filter(slug=self.slug).exists():
                self.slug = str(uuid.uuid4()).replace('-', '')[:16]
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Shareable Preview
# ---------------------------------------------------------------------------

class SharedPreview(models.Model):
    """
    Stores a snapshot of a README for a shareable public URL.
    No authentication required to create or view — anyone can
    generate a share link directly from the Editor.

    The slug is used in the public URL:
      /preview/<slug>   → frontend renders it
      /api/preview/<slug>/ → backend serves the data
    """
    TEMPLATE_CHOICES = [
        ('modern',     'Modern Badges'),
        ('minimalist', 'Minimalist'),
        ('creative',   'Creative Banner'),
    ]

    slug        = models.SlugField(
                      max_length=24,
                      unique=True,
                      db_index=True,
                  )
    title       = models.CharField(max_length=255, blank=True, default='')
    content     = models.TextField()
    template    = models.CharField(
                      max_length=32,
                      choices=TEMPLATE_CHOICES,
                      default='modern',
                  )
    # Optional — set if the creator was authenticated
    created_by  = models.ForeignKey(
                      User,
                      on_delete=models.SET_NULL,
                      null=True,
                      blank=True,
                      related_name='shared_previews',
                  )
    view_count  = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    # Previews expire after 30 days of inactivity
    expires_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Preview {self.slug} — {self.title or 'Untitled'}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = str(uuid.uuid4()).replace('-', '')[:12]
            while SharedPreview.objects.filter(slug=self.slug).exists():
                self.slug = str(uuid.uuid4()).replace('-', '')[:12]
        super().save(*args, **kwargs)