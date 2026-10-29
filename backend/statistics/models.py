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

    class CreationReason(models.TextChoices):
        """Why a statistics session row was created."""

        NO_COOKIE = 'no_cookie', 'No cookie'
        INVALID_COOKIE = 'invalid_cookie', 'Invalid cookie'
        COOKIE_SESSION_NOT_FOUND = 'cookie_session_not_found', 'Cookie session not found'
        DOMAIN_CHANGED = 'domain_changed', 'Domain changed'
        IP_CHANGED = 'ip_changed', 'IP changed'
        LOGIN_ROTATION = 'login_rotation', 'Login rotation'

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
    first_path = models.CharField(max_length=255, null=True, blank=True)
    creation_reason = models.CharField(
        max_length=32, null=True, blank=True, choices=CreationReason.choices,
    )
    first_seen_logged = models.BooleanField(null=True, blank=True)


class Visit(models.Model):
    """A burst of activity of a `Session`, closed after an inactivity window without requests."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='visits')
    started_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)
    hits = models.PositiveIntegerField(default=1)
    first_path = models.CharField(max_length=255, null=True, blank=True)
    last_path = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        """Indexes supporting visit aggregation."""

        indexes = [
            models.Index(fields=['started_at']),
            models.Index(fields=['session', 'last_seen_at']),
        ]
