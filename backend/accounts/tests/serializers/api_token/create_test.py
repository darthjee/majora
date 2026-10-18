"""Tests for the ApiTokenCreateSerializer."""

from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone

from accounts.models import ApiToken
from accounts.models.api_token import hash_secret
from accounts.serializers import ApiTokenCreateSerializer
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


@pytest.mark.django_db
class TestApiTokenCreateSerializer:
    """Tests for ApiTokenCreateSerializer."""

    def setup_method(self):
        """Set up a user who plays one game, and a game they do not reach."""
        self.user = UserFactory()
        self.game = GameFactory(name='Alpha', game_slug='alpha')
        self.other_game = GameFactory(name='Beta', game_slug='beta')
        PlayerFactory(game=self.game, user=self.user)

    def _serializer(self, user=None, **overrides):
        """Build a serializer for a valid payload with `overrides` applied."""
        data = {'name': 'Bot', 'scopes': ['npcs:read']}
        data.update(overrides)
        return ApiTokenCreateSerializer(data=data, context={'user': user or self.user})

    def _errors(self, serializer):
        """Validate `serializer` and return its error codes, keyed by field."""
        assert not serializer.is_valid()
        return {
            field: [detail.code for detail in details]
            for field, details in serializer.errors.items()
        }

    def test_valid_payload(self):
        """Test that a minimal payload is valid with defaults for games and expiry."""
        serializer = self._serializer()
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data['games'] == []
        assert serializer.validated_data['expires_at'] is None

    def test_name_is_trimmed(self):
        """Test that the name is trimmed."""
        serializer = self._serializer(name='  Bot  ')
        assert serializer.is_valid()
        assert serializer.validated_data['name'] == 'Bot'

    def test_name_required(self):
        """Test that a missing name gives required."""
        serializer = ApiTokenCreateSerializer(
            data={'scopes': ['npcs:read']}, context={'user': self.user},
        )
        assert self._errors(serializer) == {'name': ['required']}

    def test_name_blank(self):
        """Test that a whitespace-only name gives blank."""
        assert self._errors(self._serializer(name='   ')) == {'name': ['blank']}

    def test_name_max_length(self):
        """Test that a name over 100 characters gives max_length."""
        assert self._errors(self._serializer(name='a' * 101)) == {'name': ['max_length']}

    def test_name_at_max_length(self):
        """Test that a 100-character name is accepted."""
        assert self._serializer(name='a' * 100).is_valid()

    def test_scopes_required(self):
        """Test that missing scopes give required."""
        serializer = ApiTokenCreateSerializer(data={'name': 'Bot'}, context={'user': self.user})
        assert self._errors(serializer) == {'scopes': ['required']}

    def test_scopes_empty(self):
        """Test that an empty scope list gives empty."""
        assert self._errors(self._serializer(scopes=[])) == {'scopes': ['empty']}

    def test_scopes_invalid(self):
        """Test that a scope outside the catalogue gives invalid_scope."""
        errors = self._errors(self._serializer(scopes=['npcs:read', 'staff:write']))
        assert errors == {'scopes': ['invalid_scope']}

    def test_scopes_duplicate(self):
        """Test that a repeated scope gives duplicate_scope."""
        errors = self._errors(self._serializer(scopes=['npcs:read', 'npcs:read']))
        assert errors == {'scopes': ['duplicate_scope']}

    def test_games_reachable(self):
        """Test that a reachable slug resolves to its game."""
        serializer = self._serializer(games=['alpha'])
        assert serializer.is_valid()
        assert serializer.validated_data['games'] == [self.game]

    def test_games_unknown(self):
        """Test that an unknown slug gives game_not_reachable."""
        errors = self._errors(self._serializer(games=['nope']))
        assert errors == {'games': ['game_not_reachable']}

    def test_games_unreachable(self):
        """Test that an existing but unreachable slug gives game_not_reachable."""
        errors = self._errors(self._serializer(games=['beta']))
        assert errors == {'games': ['game_not_reachable']}

    def test_games_duplicate(self):
        """Test that a repeated slug gives duplicate_game."""
        errors = self._errors(self._serializer(games=['alpha', 'alpha']))
        assert errors == {'games': ['duplicate_game']}

    def test_superuser_reaches_any_game(self):
        """Test that a superuser may pick a game they are not a member of."""
        assert self._serializer(user=SuperUserFactory(), games=['beta']).is_valid()

    def test_plain_staff_non_member_not_reachable(self):
        """Test that a plain staff non-member gets game_not_reachable."""
        staff = UserFactory(is_staff=True)
        errors = self._errors(self._serializer(user=staff, games=['alpha']))
        assert errors == {'games': ['game_not_reachable']}

    def test_expires_at_invalid(self):
        """Test that an unparseable expiry gives invalid."""
        errors = self._errors(self._serializer(expires_at='not-a-date'))
        assert errors == {'expires_at': ['invalid']}

    def test_expires_at_in_past(self):
        """Test that a past expiry gives expires_in_past."""
        past = (timezone.now() - timedelta(days=1)).isoformat()
        errors = self._errors(self._serializer(expires_at=past))
        assert errors == {'expires_at': ['expires_in_past']}

    def test_expires_at_now_boundary(self):
        """Test that an expiry equal to now is rejected."""
        now = timezone.now()
        with mock.patch('accounts.serializers.api_token.create.timezone.now', return_value=now):
            errors = self._errors(self._serializer(expires_at=now.isoformat()))
        assert errors == {'expires_at': ['expires_in_past']}

    def test_expires_at_future(self):
        """Test that a future expiry is accepted."""
        future = timezone.now() + timedelta(days=30)
        serializer = self._serializer(expires_at=future.isoformat())
        assert serializer.is_valid()
        assert serializer.validated_data['expires_at'] == future

    def test_expires_at_null_means_never(self):
        """Test that an explicit null expiry means never."""
        serializer = self._serializer(expires_at=None)
        assert serializer.is_valid()
        assert serializer.validated_data['expires_at'] is None

    @pytest.mark.parametrize('field', ['owner', 'prefix', 'id', 'last_used_at'])
    def test_unknown_field_not_editable(self, field):
        """Test that a field outside the create payload gives not_editable."""
        errors = self._errors(self._serializer(**{field: 1}))
        assert errors == {field: ['not_editable']}

    def test_errors_reported_together(self):
        """Test that several bad fields are reported in one set of errors."""
        serializer = ApiTokenCreateSerializer(
            data={'name': '', 'scopes': [], 'games': ['beta'], 'owner': 1},
            context={'user': self.user},
        )
        assert self._errors(serializer) == {
            'name': ['blank'],
            'scopes': ['empty'],
            'games': ['game_not_reachable'],
            'owner': ['not_editable'],
        }

    def test_save_creates_token_for_context_user(self):
        """Test that saving creates the token for the context user and exposes it once."""
        serializer = self._serializer(games=['alpha'])
        assert serializer.is_valid()
        api_token = serializer.save()
        data = serializer.created_data()
        _, prefix, secret = data['token'].split('_')
        assert api_token.owner == self.user
        assert prefix == api_token.prefix
        assert hash_secret(secret) == api_token.hashed_secret
        assert data['games'] == [{'slug': 'alpha', 'name': 'Alpha'}]
        assert ApiToken.objects.filter(owner=self.user).count() == 1
