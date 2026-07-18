"""Tests for the PC money-only update (PUT) endpoint."""

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)
from games.tests.views.support import assert_json_response


@pytest.mark.django_db
class TestGamePcMoneyView(TokenAuthRequestMixin):
    """Tests for the PC money-only update endpoint."""

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, a regular player, and the PC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player = PlayerFactory(name='Bob', game=self.game)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, money=100, npc=False,
        )
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.regular_player_user = UserFactory(
            username='regular_player', password='secret-password',
        )
        self.regular_player = PlayerFactory(
            name='Alice', user=self.regular_player_user, game=self.game
        )

    def _owner_token(self):
        """Return the PC's owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None):
        """Return the money-update URL for the given character id (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/test-game/pcs/{character_id}/money.json'

    def _put(self, client, payload, token=None):
        """Issue a PUT request to the money-update endpoint, optionally with a token."""
        return self.put(client, self._url(), payload, token=token)

    def test_put_without_token_returns_401(self, client):
        """Test that PUT without a token is rejected with 401."""
        response = self._put(client, {'money': 200})
        assert response.status_code == 401

    def test_put_with_unrelated_user_returns_403(self, client):
        """Test that PUT from an unrelated user's token is rejected with 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)

        response = self._put(client, {'money': 200}, token=token)

        assert response.status_code == 403
        self.character.refresh_from_db()
        assert self.character.money == 100

    def test_put_updates_money_for_owning_player(self, client):
        """Test that the PC's owning player can update money."""
        token = self._owner_token()

        response = self._put(client, {'money': 200}, token=token)

        assert_json_response(response, 200, money=200)
        self.character.refresh_from_db()
        assert self.character.money == 200

    def test_put_updates_money_for_regular_player_of_the_game(self, client):
        """Test that any player of the game (not just the owner) can update PC money."""
        token = Token.objects.create(user=self.regular_player_user)

        response = self._put(client, {'money': 250}, token=token)

        assert_json_response(response, 200, money=250)
        self.character.refresh_from_db()
        assert self.character.money == 250

    def test_put_updates_money_for_dm(self, client):
        """Test that a DM of the game can update money."""
        token = Token.objects.create(user=self.dm_user)

        response = self._put(client, {'money': 300}, token=token)

        assert_json_response(response, 200, money=300)
        self.character.refresh_from_db()
        assert self.character.money == 300

    def test_put_updates_money_for_superuser(self, client):
        """Test that a superuser can update money."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)

        response = self._put(client, {'money': 400}, token=token)

        assert_json_response(response, 200, money=400)
        self.character.refresh_from_db()
        assert self.character.money == 400

    def test_put_updates_money_for_staff_user(self, client):
        """Test that a global Staff account (not otherwise related to the game) can edit."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)

        response = self._put(client, {'money': 500}, token=token)

        assert_json_response(response, 200, money=500)
        self.character.refresh_from_db()
        assert self.character.money == 500

    def test_put_response_includes_full_detail_shape(self, client):
        """Test that the response body matches the CharacterDetailSerializer shape."""
        token = self._owner_token()

        response = self._put(client, {'money': 200}, token=token)

        data = assert_json_response(response, 200)
        assert data['id'] == self.character.id
        assert data['name'] == 'Aragorn'
        assert data['can_edit_money'] is True

    def test_put_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = self._owner_token()

        response = self._put(client, {'money': 200}, token=token)

        assert response['X-Skip-Cache'] == 'true'

    def test_put_missing_money_returns_400(self, client):
        """Test that a payload with no money key is rejected with 400."""
        token = self._owner_token()

        response = self._put(client, {}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 100

    def test_put_negative_money_returns_400(self, client):
        """Test that a negative money value is rejected with 400."""
        token = self._owner_token()

        response = self._put(client, {'money': -1}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 100

    def test_put_non_integer_money_returns_400(self, client):
        """Test that a non-integer money value is rejected with 400."""
        token = self._owner_token()

        response = self._put(client, {'money': 'lots'}, token=token)

        data = assert_json_response(response, 400)
        assert 'money' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 100

    def test_put_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        token = self._owner_token()

        response = self.put(client, self._url(character_id=99999), {'money': 200}, token=token)

        assert response.status_code == 404

    def test_put_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        token = self._owner_token()

        response = self.put(client, self._url(character_id=npc.id), {'money': 200}, token=token)

        assert response.status_code == 404
