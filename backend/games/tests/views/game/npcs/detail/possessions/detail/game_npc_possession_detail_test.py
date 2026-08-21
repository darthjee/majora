"""Tests for the NPC possession detail view (GET / hidden-NPC gate)."""

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
class TestGameNpcPossessionDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/possessions/<possession_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, possession_id, character_id=None, game_slug='test-game'):
        """Return the possession detail URL (defaults to the fixture character)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/possessions/{possession_id}.json'

    def test_returns_id_game_possession_id_name_description_photo_path_fields(self, client):
        """Test that the detail response includes the correct fields."""
        game_possession = GamePossessionFactory(
            game=self.game, name='The Tower', description='A tall stone tower.',
        )
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == character_possession.id
        assert data['game_possession_id'] == game_possession.id
        assert data['name'] == 'The Tower'
        assert data['photo_path'] is None

    def test_returns_404_for_hidden_character_possession(self, client):
        """Test that a hidden character possession is not visible on the public route."""
        game_possession = GamePossessionFactory(game=self.game, name='Hidden Vault')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession, hidden=True,
        )
        response = client.get(self._url(character_possession.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_possession(self, client):
        """Test that 404 is returned for a non-existent possession id."""
        response = client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the character id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        game_possession = GamePossessionFactory(game=self.game, name='Vault')
        character_possession = CharacterPossession.objects.create(
            character=other, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id, character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        game_possession = GamePossessionFactory(game=self.game, name='Vault')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        url = reverse(
            'game-npc-possession-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'possession_id': character_possession.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        game_possession = GamePossessionFactory(game=self.game, name='Vault')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id))
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGameNpcPossessionDetailHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_possession_detail."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        game_possession = GamePossessionFactory(game=self.game, name='Hidden Vault')
        self.character_possession = CharacterPossession.objects.create(
            character=self.hidden_npc, game_possession=game_possession,
        )

    def _url(self, character=None):
        """Return the possession detail URL for the given character (defaults to hidden NPC)."""
        character = character or self.hidden_npc
        return (
            f'/games/test-game/npcs/{character.id}'
            f'/possessions/{self.character_possession.id}.json'
        )

    def test_hidden_npc_possession_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's possession gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_possession_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's possession."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_possession_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's possession."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_hidden_npc_possession_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's possession."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_hidden_npc_possession_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's possession includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_possession_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's possession includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'
