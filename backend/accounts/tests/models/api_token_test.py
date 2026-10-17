"""Tests for the ApiToken model."""

import re
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.db import IntegrityError
from django.utils import timezone

from accounts.models import ApiToken
from accounts.models.api_token import hash_secret
from games.tests.factories import GameFactory, UserFactory


@pytest.mark.django_db
class TestApiToken:
    """Tests for the ApiToken model."""

    def setup_method(self):
        """Set up a user to own created API tokens."""
        self.user = UserFactory(username='alice', password='secret-password')

    def _create(self, **kwargs):
        """Create an ApiToken for the test user with sensible defaults."""
        attributes = {'name': 'automation', 'hashed_secret': 'a' * 64, 'prefix': 'AbCd1234'}
        attributes.update(kwargs)
        return ApiToken.objects.create(owner=self.user, **attributes)

    def test_defaults(self):
        """Test that scopes, expiry and last-used default to empty values."""
        token = self._create()
        assert token.scopes == []
        assert token.expires_at is None
        assert token.last_used_at is None
        assert token.created_at is not None

    def test_games_are_optional(self):
        """Test that a token can be saved without games."""
        token = self._create()
        assert token.games.count() == 0

    def test_games_can_be_assigned(self):
        """Test that games can be attached to a token."""
        token = self._create()
        game = GameFactory()
        token.games.add(game)
        assert list(token.games.all()) == [game]

    def test_owner_reverse_relation(self):
        """Test that the owner reaches the token through `api_tokens`."""
        token = self._create()
        assert list(self.user.api_tokens.all()) == [token]

    def test_is_expired_without_expiry(self):
        """Test that a token without expiry is never expired."""
        assert self._create().is_expired() is False

    def test_is_expired_with_future_expiry(self):
        """Test that a token expiring in the future is not expired."""
        token = self._create(expires_at=timezone.now() + timedelta(days=1))
        assert token.is_expired() is False

    def test_is_expired_with_past_expiry(self):
        """Test that a token whose expiry has passed is expired."""
        token = self._create(expires_at=timezone.now() - timedelta(seconds=1))
        assert token.is_expired() is True

    def test_prefix_is_unique(self):
        """Test that two tokens cannot share a prefix."""
        self._create()
        with pytest.raises(IntegrityError):
            self._create()

    def test_str_shows_owner_and_prefix_only(self):
        """Test that the string representation never includes the hash."""
        token = self._create()
        assert str(token) == 'ApiToken(owner=alice, prefix=AbCd1234)'
        assert token.hashed_secret not in str(token)


@pytest.mark.django_db
class TestApiTokenCreateToken:
    """Tests for `ApiToken.objects.create_token`."""

    TOKEN_PATTERN = re.compile(r'^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$')

    def setup_method(self):
        """Set up a user to own created API tokens."""
        self.user = UserFactory(username='alice', password='secret-password')

    def _create(self, **kwargs):
        """Create a token for the test user and return `(api_token, plain_token)`."""
        return ApiToken.objects.create_token(self.user, 'automation', ['games:read'], **kwargs)

    def test_plain_token_matches_format(self):
        """Test that the plain token matches the documented format and length."""
        _, plain = self._create()
        assert self.TOKEN_PATTERN.match(plain)
        assert len(plain) == 56

    def test_prefix_is_stored(self):
        """Test that the stored prefix is the one inside the plain token."""
        api_token, plain = self._create()
        assert api_token.prefix == self.TOKEN_PATTERN.match(plain).group(1)

    def test_only_hash_of_secret_is_stored(self):
        """Test that the stored hash is the SHA-256 of the secret part."""
        api_token, plain = self._create()
        secret = self.TOKEN_PATTERN.match(plain).group(2)
        api_token.refresh_from_db()
        assert api_token.hashed_secret == hash_secret(secret)

    def test_plain_token_is_not_stored(self):
        """Test that neither the plain token nor its secret appears on the row."""
        api_token, plain = self._create()
        secret = self.TOKEN_PATTERN.match(plain).group(2)
        row = ApiToken.objects.filter(pk=api_token.pk).values().get()
        assert all(secret not in str(value) for value in row.values())

    def test_fields_are_stored(self):
        """Test that name, scopes, owner and expiry are saved."""
        expires_at = timezone.now() + timedelta(days=30)
        api_token, _ = self._create(expires_at=expires_at)
        api_token.refresh_from_db()
        assert api_token.owner == self.user
        assert api_token.name == 'automation'
        assert api_token.scopes == ['games:read']
        assert api_token.expires_at == expires_at

    def test_games_are_attached(self):
        """Test that given games are attached to the token."""
        game = GameFactory()
        api_token, _ = self._create(games=[game])
        assert list(api_token.games.all()) == [game]

    def test_games_default_to_empty(self):
        """Test that no games means an empty games list."""
        api_token, _ = self._create()
        assert api_token.games.count() == 0

    def test_prefix_clash_is_retried(self):
        """Test that a prefix clash is retried with a fresh prefix."""
        existing, _ = self._create()
        with patch(
            'accounts.models.api_token.generate_prefix', side_effect=[existing.prefix, 'Fresh123']
        ):
            api_token, plain = self._create()
        assert api_token.prefix == 'Fresh123'
        assert plain.startswith('mjr_Fresh123_')

    def test_three_clashes_reraise(self):
        """Test that three prefix clashes in a row re-raise the IntegrityError."""
        existing, _ = self._create()
        with patch('accounts.models.api_token.generate_prefix', return_value=existing.prefix):
            with pytest.raises(IntegrityError):
                self._create()
        assert ApiToken.objects.count() == 1
