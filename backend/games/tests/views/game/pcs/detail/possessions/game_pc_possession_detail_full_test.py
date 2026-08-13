"""Tests for the PC possession detail/full.json view (dm, owner, or admin only; incl. hidden)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterPossession
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GamePossessionFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcPossessionDetailFullView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/possessions/<possession_id>/full.json."""

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, an unrelated user, and a hidden item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player = PlayerFactory(name='Bob', game=self.game, user=self.owner)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False,
        )
        self.owner_token = Token.objects.create(user=self.owner)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        game_possession = GamePossessionFactory(
            game=self.game, name='Hidden Vault', description='A secret cellar.',
        )
        self.hidden_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession, hidden=True,
        )

    def _url(self, possession_id=None, character_id=None, game_slug='test-game'):
        """Return the possession detail/full URL for the given possession (defaults to fixture)."""
        possession_id = possession_id if possession_id is not None else self.hidden_possession.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/possessions/{possession_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_owner_non_dm_user(self, client):
        """Test that an authenticated user who is not the owner/DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_owner_gets_200_for_hidden_possession(self, client):
        """Test that the PC's owning player gets 200 for a hidden possession."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Hidden Vault'

    def test_dm_gets_200_for_hidden_possession(self, client):
        """Test that the game's DM gets 200 for a hidden possession."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_gets_200_for_hidden_possession(self, client):
        """Test that a superuser gets 200 for a hidden possession."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_response_includes_hidden_field(self, client):
        """Test that the response carries the hidden flag."""
        response = self.get(client, self._url(), token=self.owner_token)
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_response_includes_description_field(self, client):
        """Test that the response carries the description field."""
        response = self.get(client, self._url(), token=self.owner_token)
        data = json.loads(response.content)
        assert data['description'] == 'A secret cellar.'

    def test_returns_404_for_unknown_possession(self, client):
        """Test that 404 is returned for a non-existent possession id."""
        response = self.get(client, self._url(possession_id=99999), token=self.owner_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.owner_token)
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-possession-detail-full',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'possession_id': self.hidden_possession.id,
            },
        )
        response = self.get(client, url, token=self.owner_token)
        assert response.status_code == 200
