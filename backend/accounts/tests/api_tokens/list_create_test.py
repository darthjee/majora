"""Tests for GET/POST /account/api_tokens.json."""

from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone

from accounts.api_tokens import reachable_games
from accounts.models import ApiToken
from accounts.tests.api_tokens.support import create_token, session_client
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory

LIST_URL = '/account/api_tokens.json'


@pytest.mark.django_db
class TestApiTokensList:
    """Tests for GET /account/api_tokens.json."""

    def setup_method(self):
        """Set up an owner with a game and a session client."""
        self.user = UserFactory()
        self.game = GameFactory(name='Alpha', game_slug='alpha')
        self.client = session_client(self.user)

    def test_lists_only_own_tokens_newest_first(self):
        """Test that the list holds the caller's tokens only, newest first, as an array."""
        older = create_token(self.user, name='Older')
        newer = create_token(self.user, name='Newer')
        create_token(UserFactory(), name='Theirs')
        ApiToken.objects.filter(pk=older.pk).update(
            created_at=timezone.now() - timedelta(days=1),
        )
        data = self.client.get(LIST_URL).json()
        assert [item['id'] for item in data] == [newer.pk, older.pk]

    def test_item_shape(self):
        """Test the item shape: sorted scopes, `{slug, name}` games, null expiry, status."""
        create_token(self.user, scopes=['npcs:write', 'documents:read'], games=[self.game])
        item = self.client.get(LIST_URL).json()[0]
        assert item['scopes'] == ['documents:read', 'npcs:write']
        assert item['games'] == [{'slug': 'alpha', 'name': 'Alpha'}]
        assert item['expires_at'] is None
        assert item['status'] == 'active'

    def test_expired_status(self):
        """Test that an expired token is listed with the expired status."""
        create_token(self.user, expires_at=timezone.now() - timedelta(days=1))
        assert self.client.get(LIST_URL).json()[0]['status'] == 'expired'


@pytest.mark.django_db
class TestApiTokensCreate:
    """Tests for POST /account/api_tokens.json."""

    def setup_method(self):
        """Set up an owner playing one game, another game and a session client."""
        self.user = UserFactory()
        self.game = GameFactory(name='Alpha', game_slug='alpha')
        self.other_game = GameFactory(name='Beta', game_slug='beta')
        PlayerFactory(game=self.game, user=self.user)
        self.client = session_client(self.user)

    def _post(self, client=None, **overrides):
        """POST a valid payload with `overrides` applied."""
        body = {'name': 'Bot', 'scopes': ['npcs:read']}
        body.update(overrides)
        return (client or self.client).post(LIST_URL, body, format='json')

    def test_returns_token_once(self):
        """Test that 201 carries the full token and later lists never show it or the hash."""
        response = self._post(games=['alpha'])
        assert response.status_code == 201
        data = response.json()
        api_token = ApiToken.objects.get(pk=data['id'])
        assert data['token'].startswith(f'mjr_{api_token.prefix}_')
        assert data['games'] == [{'slug': 'alpha', 'name': 'Alpha'}]
        listed = self.client.get(LIST_URL).content.decode()
        assert data['token'] not in listed
        assert api_token.hashed_secret not in listed
        assert 'token' not in self.client.get(LIST_URL).json()[0]

    def test_owner_is_request_user(self):
        """Test that the created token belongs to the caller."""
        data = self._post().json()
        assert ApiToken.objects.get(pk=data['id']).owner == self.user

    @pytest.mark.parametrize('field', ['owner', 'prefix', 'id', 'last_used_at'])
    def test_extra_field_not_editable(self, field):
        """Test that a field outside the create payload gives 400 not_editable."""
        response = self._post(**{field: 1})
        assert response.status_code == 400
        assert response.json() == {'errors': {field: ['not_editable']}}
        assert not ApiToken.objects.exists()

    def test_errors_reported_together(self):
        """Test that several bad fields are reported in one 400."""
        response = self._post(name='', scopes=['bad'], games=['beta'], expires_at='nope')
        assert response.status_code == 400
        assert response.json() == {'errors': {
            'name': ['blank'],
            'scopes': ['invalid_scope'],
            'games': ['game_not_reachable'],
            'expires_at': ['invalid'],
        }}

    def test_missing_and_null_expiry_mean_never(self):
        """Test that a missing and an explicit null expiry both mean never."""
        assert self._post().json()['expires_at'] is None
        assert self._post(expires_at=None).json()['expires_at'] is None

    def test_superuser_may_pick_any_game(self):
        """Test that a superuser may limit a token to a game they are not a member of."""
        response = self._post(client=session_client(SuperUserFactory()), games=['beta'])
        assert response.status_code == 201

    def test_plain_staff_non_member_not_reachable(self):
        """Test that a plain staff non-member gets game_not_reachable."""
        client = session_client(UserFactory(is_staff=True))
        response = self._post(client=client, games=['alpha'])
        assert response.json() == {'errors': {'games': ['game_not_reachable']}}

    def test_form_encoded_body_gives_415(self):
        """Test that a form-encoded body gives 415."""
        response = self.client.post(
            LIST_URL, 'name=Bot&scopes=npcs:read',
            content_type='application/x-www-form-urlencoded',
        )
        assert response.status_code == 415
        assert not ApiToken.objects.exists()

    def test_prefix_collision_is_retried(self):
        """Test that a clashing prefix is retried with a fresh one."""
        existing = create_token(UserFactory())
        with mock.patch(
            'accounts.models.api_token.generate_prefix',
            side_effect=[existing.prefix, 'Fresh123'],
        ):
            response = self._post()
        assert response.status_code == 201
        assert response.json()['prefix'] == 'Fresh123'

    def test_prefix_retries_exhausted_gives_500(self):
        """Test that exhausting the prefix retries gives a 500."""
        existing = create_token(UserFactory())
        client = session_client(self.user)
        client.raise_request_exception = False
        with mock.patch(
            'accounts.models.api_token.generate_prefix', return_value=existing.prefix,
        ):
            response = self._post(client=client)
        assert response.status_code == 500
        assert ApiToken.objects.filter(owner=self.user).count() == 0


@pytest.mark.django_db
class TestApiTokenGameEdgeCases:
    """Edge cases tying a token's games to the owner's memberships."""

    def setup_method(self):
        """Set up an owner and a game they later join or leave."""
        self.user = UserFactory()
        self.game = GameFactory(name='Alpha', game_slug='alpha')

    def test_empty_games_cover_game_joined_later(self):
        """Test that `games: []` resolves to a game the owner joins after creation."""
        api_token = create_token(self.user)
        PlayerFactory(game=self.game, user=self.user)
        assert list(api_token.games.all()) == []
        assert self.game in reachable_games(api_token.owner)

    def test_owner_leaving_listed_game_keeps_token(self):
        """Test that an owner who leaves a listed game keeps the token and its game list."""
        player = PlayerFactory(game=self.game, user=self.user)
        api_token = create_token(self.user, games=[self.game])
        player.delete()
        api_token.refresh_from_db()
        assert list(api_token.games.all()) == [self.game]
        item = session_client(self.user).get(LIST_URL).json()[0]
        assert item['games'] == [{'slug': 'alpha', 'name': 'Alpha'}]

