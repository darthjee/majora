"""Tests for the ApiTokenItemSerializer."""

from datetime import timedelta

import pytest
from django.utils import timezone

from accounts.models import ApiToken
from accounts.serializers import ApiTokenItemSerializer
from games.tests.factories import GameFactory, UserFactory


@pytest.mark.django_db
class TestApiTokenItemSerializer:
    """Tests for ApiTokenItemSerializer."""

    def setup_method(self):
        """Set up a user, two games and a token on both games."""
        self.user = UserFactory()
        self.zeta = GameFactory(name='Zeta', game_slug='zeta')
        self.alpha = GameFactory(name='Alpha', game_slug='alpha')
        self.api_token, _ = ApiToken.objects.create_token(
            self.user, 'Bot', ['npcs:write', 'documents:read'], games=[self.zeta, self.alpha],
        )

    def _data(self):
        """Serialize the token."""
        return ApiTokenItemSerializer(self.api_token).data

    def test_fields(self):
        """Test that the item carries exactly the metadata fields."""
        assert set(self._data()) == {
            'id', 'name', 'prefix', 'scopes', 'games', 'expires_at', 'last_used_at',
            'created_at', 'status',
        }

    def test_never_emits_hash(self):
        """Test that the hashed secret never appears in the payload."""
        assert self.api_token.hashed_secret not in str(self._data())

    def test_scopes_are_sorted(self):
        """Test that scopes are sorted."""
        assert self._data()['scopes'] == ['documents:read', 'npcs:write']

    def test_games_are_slug_name_pairs(self):
        """Test that games are `{slug, name}` pairs sorted by name."""
        assert self._data()['games'] == [
            {'slug': 'alpha', 'name': 'Alpha'},
            {'slug': 'zeta', 'name': 'Zeta'},
        ]

    def test_never_expiring_token(self):
        """Test that a never-expiring token has a null expiry and is active."""
        data = self._data()
        assert data['expires_at'] is None
        assert data['status'] == 'active'

    def test_expired_token_status(self):
        """Test that a token past its expiry has the expired status."""
        self.api_token.expires_at = timezone.now() - timedelta(minutes=1)
        assert self._data()['status'] == 'expired'

    def test_future_expiry_is_active(self):
        """Test that a token with a future expiry is active."""
        self.api_token.expires_at = timezone.now() + timedelta(days=1)
        assert self._data()['status'] == 'active'
