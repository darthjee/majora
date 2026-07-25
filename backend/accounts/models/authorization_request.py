"""AuthorizationRequest model for Majora RPG Campaign Management System."""

import hashlib
import hmac
import secrets
import uuid
from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

EXPIRATION = timedelta(hours=1)


class AuthorizationRequest(models.Model):
    """Model representing a passwordless "authorize with logged device" login request.

    `token_hash` stores only a SHA-256 hash of the high-entropy bearer token handed to the
    requesting device, never the raw token itself. This is a deliberate deviation from
    `PasswordResetToken` (which stores its token in plaintext): the token here is a bearer
    credential that directly yields a real login the moment `poll` observes `approved`,
    a strictly higher-stakes value, so it is hashed at rest and only ever compared via
    `hmac.compare_digest` (constant-time), never a plain `==`.
    """

    STATUS_OPEN = 'open'
    STATUS_APPROVED = 'approved'
    STATUS_DENIED = 'denied'
    STATUS_EXPIRED = 'expired'
    STATUS_LOGGED = 'logged'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_DENIED, 'Denied'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_LOGGED, 'Logged'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    token_hash = models.CharField(max_length=128)
    ip = models.GenericIPAddressField()
    browser = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name='authorization_requests',
    )
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_OPEN)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the AuthorizationRequest model."""

        ordering = ['-id']

    @classmethod
    def create_with_token(cls, user, ip, browser):
        """Create a new request for `user` (may be `None`); return `(instance, raw_token)`."""
        raw_token = secrets.token_urlsafe(32)
        created_at = timezone.now()
        instance = cls.objects.create(
            user=user,
            ip=ip,
            browser=browser,
            token_hash=cls._hash_token(raw_token),
            expires_at=created_at + EXPIRATION,
        )
        return instance, raw_token

    def is_expired(self):
        """Return whether this request is lazily past due, evaluated against the current time."""
        return timezone.now() > self.expires_at

    def mark_expired(self):
        """Persist this request's status as `expired`."""
        self.status = self.STATUS_EXPIRED
        self.save(update_fields=['status', 'updated_at'])

    def try_transition_approved_to_logged(self):
        """Atomically transition `approved` -> `logged`; return whether this call won the race.

        Uses a single `UPDATE ... WHERE status='approved'` guarded update so that, when two
        pollers observe `approved` at nearly the same time, only one of them can flip the row
        (and thus receive login credentials); the other sees this return `False`.
        """
        updated = AuthorizationRequest.objects.filter(
            pk=self.pk, status=self.STATUS_APPROVED,
        ).update(status=self.STATUS_LOGGED)
        if updated:
            self.status = self.STATUS_LOGGED
        return bool(updated)

    def matches_token(self, raw_token):
        """Return whether `raw_token` matches this request's stored hash, constant-time."""
        return hmac.compare_digest(self.token_hash, self._hash_token(raw_token or ''))

    @staticmethod
    def _hash_token(raw_token):
        """Return the SHA-256 hex digest of `raw_token`."""
        return hashlib.sha256(raw_token.encode()).hexdigest()

    def __str__(self):
        """Return string representation of the authorization request."""
        return f'AuthorizationRequest(uuid={self.uuid}, status={self.status})'
