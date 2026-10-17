"""Tests for the ApiToken model."""

from datetime import timedelta

import pytest
from django.db import IntegrityError
from django.utils import timezone

from accounts.models import ApiToken
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
