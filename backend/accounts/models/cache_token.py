"""CacheToken model for Majora RPG Campaign Management System."""

import binascii
import os

from django.contrib.auth.models import User
from django.db import models


def _generate_key():
    """Generate a random 40-char hex key, mirroring rest_framework.authtoken.models.Token."""
    return binascii.hexlify(os.urandom(20)).decode()


class CacheToken(models.Model):
    """Model representing a per-user credential used only to key the proxy's private cache.

    Deliberately never consulted by any backend authentication class
    (`CookieTokenAuthentication` et al.) — even an unhashed leak of this
    value can never authenticate a real (mutating) backend request. It only
    ever has meaning as private-cache hash input on the Tent proxy side.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cache_token')
    key = models.CharField(max_length=40, unique=True, default=_generate_key)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for the CacheToken model."""

        db_table = 'accounts_cachetoken'

    def __str__(self):
        """Return string representation of the cache token."""
        return f'CacheToken(user={self.user.username})'
