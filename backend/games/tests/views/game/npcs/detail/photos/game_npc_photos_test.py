"""Tests for the NPC photos view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcPhotosView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/photos.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the photos list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/photos.json'

    def test_returns_empty_list_when_no_photos(self, client):
        """Test that an empty list is returned when the character has no photos."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_photos(self, client):
        """Test that only ready photos are returned."""
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/ready.png',
            character=self.character,
            ready=True,
        )
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/not-ready.png',
            character=self.character,
            ready=False,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['path'] == 'photos/games/test-game/characters/1/ready.png'

    def test_returns_id_and_path_fields(self, client):
        """Test that list items include id and path fields."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/gandalf.png',
            character=self.character,
            ready=True,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['id'] == photo.id
        assert data[0]['path'] == photo.path

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(self._url())
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(f'{self._url()}?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            CharacterPhoto.objects.create(
                path=f'photos/games/test-game/characters/1/photo-{i}.png',
                character=self.character,
                ready=True,
            )
        response = client.get(f'{self._url()}?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-photos',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcPhotosHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_photos."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/secret.png',
            character=self.hidden_npc,
            ready=True,
        )

    def _url(self, character=None):
        """Return the photos list URL for the given character (defaults to the hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/photos.json'

    def test_hidden_npc_photos_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's photos gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_photos_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's photos."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_photos_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's photos."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_photos_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's photos."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_visible_npc_photos_returns_200_for_anonymous(self, client):
        """Test that a visible NPC's photos are still accessible to anonymous users."""
        visible_npc = CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/2/visible.png',
            character=visible_npc,
            ready=True,
        )
        response = self.get(client, self._url(character=visible_npc))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_photos_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's photos includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_photos_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's photos includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_visible_npc_photos_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's photos response does not include X-Skip-Cache."""
        visible_npc = CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        response = self.get(client, self._url(character=visible_npc))
        assert 'X-Skip-Cache' not in response
