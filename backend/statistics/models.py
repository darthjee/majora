"""Models for the statistics app."""

import secrets

from django.conf import settings
from django.db import models


def _generate_token():
    """Return a new random, URL-safe session token."""
    return secrets.token_urlsafe(32)


class Session(models.Model):
    """A single tracked visit, by an anonymous or logged-in user, identified by a cookie token."""

    token = models.CharField(max_length=64, unique=True, db_index=True, default=_generate_token)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='statistics_sessions',
    )
    ip = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
