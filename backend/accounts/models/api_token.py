"""ApiToken model for Majora RPG Campaign Management System."""

import hashlib
import secrets
import string

from django.contrib.auth.models import User
from django.db import IntegrityError, models, transaction
from django.utils import timezone

ALPHABET = string.ascii_letters + string.digits
PREFIX_LENGTH = 8
SECRET_LENGTH = 43
TOKEN_TAG = 'mjr'
MAX_CREATE_ATTEMPTS = 3


def hash_secret(secret):
    """Return the SHA-256 hex digest of a token's secret part."""
    return hashlib.sha256(secret.encode()).hexdigest()


def random_base62(length):
    """Return `length` characters drawn uniformly from the base62 alphabet."""
    return ''.join(secrets.choice(ALPHABET) for _ in range(length))


def generate_prefix():
    """Return a new random token prefix."""
    return random_base62(PREFIX_LENGTH)


def generate_secret():
    """Return a new random token secret."""
    return random_base62(SECRET_LENGTH)


class ApiTokenManager(models.Manager):
    """Manager creating API tokens and returning their plain value once."""

    def create_token(self, owner, name, scopes, games=None, expires_at=None):
        """Create a token and return `(api_token, plain_token)`, retrying on prefix clashes."""
        for attempt in range(1, MAX_CREATE_ATTEMPTS + 1):
            try:
                return self._create_attempt(owner, name, scopes, games, expires_at)
            except IntegrityError:
                if attempt == MAX_CREATE_ATTEMPTS:
                    raise

    def _create_attempt(self, owner, name, scopes, games, expires_at):
        """Try once to create a token with a fresh prefix and secret."""
        prefix, secret = generate_prefix(), generate_secret()
        with transaction.atomic():
            api_token = self.create(
                owner=owner,
                name=name,
                scopes=scopes,
                expires_at=expires_at,
                prefix=prefix,
                hashed_secret=hash_secret(secret),
            )
            api_token.games.set(games or [])
        return api_token, f'{TOKEN_TAG}_{prefix}_{secret}'


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

    objects = ApiTokenManager()

    class Meta:
        """Metadata for the ApiToken model."""

        db_table = 'accounts_apitoken'

    def __str__(self):
        """Return string representation of the API token, without the hash."""
        return f'ApiToken(owner={self.owner.username}, prefix={self.prefix})'

    def is_expired(self):
        """Return True when the token has an expiry in the past."""
        return self.expires_at is not None and self.expires_at <= timezone.now()
