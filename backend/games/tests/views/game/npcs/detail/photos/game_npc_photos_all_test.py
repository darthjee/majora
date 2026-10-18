"""Tests for the NPC photos/all.json view (NPC editors only, serves a hidden NPC)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcPhotosAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/photos/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user and a hidden NPC with photos."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        PlayerFactory(game=self.game, user=self.other_user)
        self.other_token = Token.objects.create(user=self.other_user)
        self.npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/ready.png',
            character=self.npc,
            ready=True,
        )
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/not-ready.png',
            character=self.npc,
            ready=False,
        )

    def _url(self, character_id=None):
        """Return the photos/all URL for the given character (defaults to the hidden NPC)."""
        character_id = character_id if character_id is not None else self.npc.id
        return f'/games/test-game/npcs/{character_id}/photos/all.json'

    def test_returns_401_for_anonymous(self, client):
        """Test that an anonymous request returns 401 without revealing the hidden NPC."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_editor(self, client):
        """Test that a player who cannot edit the NPC gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_ready_photos_of_hidden_npc(self, client):
        """Test that a DM gets the ready photos of a hidden NPC."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert [photo['path'] for photo in data] == [
            'photos/games/test-game/characters/1/ready.png',
        ]

    def test_superuser_gets_photos_of_hidden_npc(self, client):
        """Test that a superuser gets the photos of a hidden NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        assert len(json.loads(response.content)) == 1

    def test_returns_id_and_path_fields(self, client):
        """Test that each item carries only the id and path fields."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert set(data[0].keys()) == {'id', 'path'}

    def test_response_sets_x_skip_cache(self, client):
        """Test that a successful response always carries X-Skip-Cache: true."""
        self.npc.hidden = False
        self.npc.save()
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_npc(self, client):
        """Test that an unknown character id returns 404."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that a PC id returns 404 since the route is NPC-only."""
        pc = CharacterFactory(name='Hero', game=self.game, npc=False)
        response = self.get(client, self._url(character_id=pc.id), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is reachable by its URL name."""
        url = reverse(
            'game-npc-photos-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.npc.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
