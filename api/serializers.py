# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, ReadmeTemplate


# ---------------------------------------------------------------------------
# User & Profile
# ---------------------------------------------------------------------------

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ('github_username', 'avatar_url', 'bio')


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')


# ---------------------------------------------------------------------------
# README Template
# ---------------------------------------------------------------------------

class ReadmeTemplateSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model  = ReadmeTemplate
        fields = (
            'id', 'title', 'content', 'created_by',
            'is_public', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# AI Generation
# ---------------------------------------------------------------------------

class GenerateReadmeSerializer(serializers.Serializer):
    """
    Validates the payload sent to /api/generate/.
    All fields are optional so users can generate from partial data.
    """
    name             = serializers.CharField(max_length=255, required=False, allow_blank=True)
    subtitle         = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description      = serializers.CharField(required=False, allow_blank=True)
    bio              = serializers.CharField(required=False, allow_blank=True)
    currentLearning  = serializers.CharField(required=False, allow_blank=True)
    githubUsername   = serializers.CharField(max_length=255, required=False, allow_blank=True)
    skills           = serializers.ListField(
                           child=serializers.CharField(),
                           required=False,
                           default=list,
                       )
    projects         = serializers.ListField(
                           child=serializers.DictField(),
                           required=False,
                           default=list,
                       )
    socialLinks      = serializers.DictField(
                           child=serializers.CharField(allow_blank=True),
                           required=False,
                           default=dict,
                       )
    template         = serializers.ChoiceField(
                           choices=['modern', 'minimalist', 'creative'],
                           default='modern',
                       )
    prompt           = serializers.CharField(
                           required=False,
                           allow_blank=True,
                           help_text="Optional free-text prompt to guide the AI generation.",
                       )


# ---------------------------------------------------------------------------
# GitHub Sync
# ---------------------------------------------------------------------------

class GitHubSyncSerializer(serializers.Serializer):
    """
    Validates the payload sent to /api/github/sync/.
    The frontend sends the GitHub OAuth access token so the backend
    can call the GitHub API on the user's behalf.
    """
    access_token = serializers.CharField()


class GitHubRepoSerializer(serializers.Serializer):
    """
    Shape of each repo object returned by /api/github/sync/.
    Used internally to validate GitHub API responses before
    sending them to the frontend.
    """
    name        = serializers.CharField()
    description = serializers.CharField(allow_null=True, allow_blank=True)
    url         = serializers.CharField()
    stars       = serializers.IntegerField()
    language    = serializers.CharField(allow_null=True, allow_blank=True)
    is_fork     = serializers.BooleanField()


# ---------------------------------------------------------------------------
# GitHub Push
# ---------------------------------------------------------------------------

class GitHubPushSerializer(serializers.Serializer):
    """
    Validates the payload sent to /api/github/push/.
    The frontend sends the generated markdown content and the
    GitHub OAuth access token so the backend can commit the
    README directly to the user's profile repo.
    """
    access_token = serializers.CharField()
    content      = serializers.CharField()
    commit_message = serializers.CharField(
        required=False,
        default='Update README.md via README Generator',
    )


# ---------------------------------------------------------------------------
# Gallery / Public READMEs
# ---------------------------------------------------------------------------

class PublishReadmeSerializer(serializers.Serializer):
    """
    Validates the payload sent to /api/gallery/publish/.
    """
    title    = serializers.CharField(max_length=255)
    content  = serializers.CharField()
    template = serializers.ChoiceField(
                   choices=['modern', 'minimalist', 'creative'],
                   default='modern',
               )


class GalleryItemSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for listing public READMEs in the gallery.
    """
    created_by = serializers.StringRelatedField(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = ReadmeTemplate
        fields = (
            'id', 'title', 'content', 'created_by',
            'avatar_url', 'created_at',
        )

    def get_avatar_url(self, obj):
        if not obj.created_by:
            return None
        try:
            return obj.created_by.profile.avatar_url
        except UserProfile.DoesNotExist:
            return None


# ---------------------------------------------------------------------------
# README Score
# ---------------------------------------------------------------------------

class ReadmeScoreSerializer(serializers.Serializer):
    """
    Validates the payload sent to /api/score/.
    The frontend sends the current form data and gets back
    a score and list of suggestions.
    """
    name            = serializers.CharField(required=False, allow_blank=True)
    subtitle        = serializers.CharField(required=False, allow_blank=True)
    description     = serializers.CharField(required=False, allow_blank=True)
    bio             = serializers.CharField(required=False, allow_blank=True)
    currentLearning = serializers.CharField(required=False, allow_blank=True)
    githubUsername  = serializers.CharField(required=False, allow_blank=True)
    skills          = serializers.ListField(
                          child=serializers.CharField(),
                          required=False,
                          default=list,
                      )
    projects        = serializers.ListField(
                          child=serializers.DictField(),
                          required=False,
                          default=list,
                      )
    socialLinks     = serializers.DictField(
                          child=serializers.CharField(allow_blank=True),
                          required=False,
                          default=dict,
                      )
    showStats       = serializers.BooleanField(required=False, default=False)


# ---------------------------------------------------------------------------
# Shareable Preview
# ---------------------------------------------------------------------------

class PreviewSerializer(serializers.Serializer):
    """
    Validates the payload sent to /api/preview/create/.
    The frontend sends the markdown content and gets back
    a unique shareable slug.
    """
    content  = serializers.CharField()
    title    = serializers.CharField(max_length=255, required=False, allow_blank=True)
    template = serializers.ChoiceField(
                   choices=['modern', 'minimalist', 'creative'],
                   default='modern',
               )