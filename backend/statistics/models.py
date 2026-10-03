"""Models for the statistics app."""

import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


def _generate_token():
    """Return a new random, URL-safe session token."""
    return secrets.token_urlsafe(32)


class Session(models.Model):
    """A visitor (device/browser) identity, anonymous or logged-in, identified by a cookie token.

    Activity is tracked by the session's `Visit` records, not by the session itself.
    """

    token = models.CharField(max_length=64, unique=True, db_index=True, default=_generate_token)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='statistics_sessions',
    )
    ip = models.GenericIPAddressField()
    domain = models.ForeignKey(
        'domains.Domain', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='statistics_sessions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)


class Visit(models.Model):
    """A burst of activity of a `Session`, closed after an inactivity window without requests."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='visits')
    started_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)
    hits = models.PositiveIntegerField(default=1)

    class Meta:
        """Indexes supporting visit aggregation."""

        indexes = [
            models.Index(fields=['started_at']),
            models.Index(fields=['session', 'last_seen_at']),
        ]
