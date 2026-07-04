"""Tests for the game photos view."""

import json

import pytest
from django.urls import reverse

from games.models import Game, GamePhoto


@pytest.mark.django_db
class TestGamePhotosView:

    """Tests for the GET /games/<slug>/photos.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.other_game = Game.objects.create(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_photos(self, client):
        """Test that an empty list is returned when the game has no photos."""
        response = client.get('/games/test-game/photos.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_photos(self, client):
        """Test that only ready photos are returned."""
        GamePhoto.objects.create(
            path='photos/games/test-game/ready.png', game=self.game, ready=True
        )
        GamePhoto.objects.create(
            path='photos/games/test-game/not-ready.png', game=self.game, ready=False
        )
        response = client.get('/games/test-game/photos.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['path'] == 'photos/games/test-game/ready.png'

    def test_returns_only_game_photos(self, client):
        """Test that only photos linked to the game are returned."""
        photo = GamePhoto.objects.create(
            path='photos/games/test-game/mine.png', game=self.game, ready=True
        )
        GamePhoto.objects.create(
            path='photos/games/other-game/theirs.png', game=self.other_game, ready=True
        )
        response = client.get('/games/test-game/photos.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == photo.id

    def test_returns_id_and_path_fields(self, client):
        """Test that list items include id and path fields."""
        photo = GamePhoto.objects.create(
            path='photos/games/test-game/cover.png', game=self.game, ready=True
        )
        response = client.get('/games/test-game/photos.json')
        data = json.loads(response.content)
        assert data[0]['id'] == photo.id
        assert data[0]['path'] == 'photos/games/test-game/cover.png'

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = client.get('/games/unknown-game/photos.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/photos.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/photos.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/photos.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GamePhoto.objects.create(
                path=f'photos/games/test-game/photo-{i}.png', game=self.game, ready=True
            )
        response = client.get('/games/test-game/photos.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            GamePhoto.objects.create(
                path=f'photos/games/test-game/photo-{i}.png', game=self.game, ready=True
            )
        response = client.get('/games/test-game/photos.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-photos', kwargs={'game_slug': 'test-game'})
        response = client.get(url)
        assert response.status_code == 200
