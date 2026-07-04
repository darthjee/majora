"""Tests for the NPC photos view."""

import json

import pytest
from django.urls import reverse

from games.models import Character, CharacterPhoto, Game


@pytest.mark.django_db
class TestGameNpcPhotosView:

    """Tests for the GET /games/<slug>/npcs/<id>/photos.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Gandalf', game=self.game, npc=True)

    def test_returns_empty_list_when_no_photos(self, client):
        """Test that an empty list is returned when the NPC has no photos."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/photos.json')
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
        response = client.get(f'/games/test-game/npcs/{self.character.id}/photos.json')
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
        response = client.get(f'/games/test-game/npcs/{self.character.id}/photos.json')
        data = json.loads(response.content)
        assert data[0]['id'] == photo.id
        assert data[0]['path'] == 'photos/games/test-game/characters/1/gandalf.png'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999/photos.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.character.id}/photos.json')
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = Character.objects.create(name='Aragorn', game=self.game, npc=False)
        response = client.get(f'/games/test-game/npcs/{pc.id}/photos.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/photos.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/photos.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(
            f'/games/test-game/npcs/{self.character.id}/photos.json?per_page=5'
        )
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            CharacterPhoto.objects.create(
                path=f'photos/games/test-game/characters/1/photo-{i}.png',
                character=self.character,
                ready=True,
            )
        response = client.get(
            f'/games/test-game/npcs/{self.character.id}/photos.json?page=2&per_page=3'
        )
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
