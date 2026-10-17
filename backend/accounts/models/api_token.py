"""ApiToken model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class ApiToken(models.Model):
    """Model representing a scoped API token sent as `Authorization: Bearer mjr_...`.

    Only the SHA-256 hex digest of the secret part is stored, alongside a unique,
    non-secret prefix used for lookup. Revoking a token deletes its row.
    """

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_tokens')
    name = models.CharField(max_length=255)
    hashed_secret = models.CharField(max_length=64)
    prefix = models.CharField(max_length=8, unique=True, db_index=True)
    scopes = models.JSONField(default=list)
    games = models.ManyToManyField('games.Game', blank=True, related_name='api_tokens')
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for the ApiToken model."""

        db_table = 'accounts_apitoken'

    def __str__(self):
        """Return string representation of the API token, without the hash."""
        return f'ApiToken(owner={self.owner.username}, prefix={self.prefix})'

    def is_expired(self):
        """Return True when the token has an expiry in the past."""
        return self.expires_at is not None and self.expires_at <= timezone.now()
