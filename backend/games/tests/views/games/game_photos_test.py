"""Tests for the game photos view."""

import json

from django.test import TestCase
from django.urls import reverse

from games.models import GamePhoto
from games.tests.factories import GameFactory


class TestGamePhotosView(TestCase):
    """Tests for the GET /games/<slug>/photos.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_photos(self):
        """Test that an empty list is returned when the game has no photos."""
        response = self.client.get('/games/test-game/photos.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_photos(self):
        """Test that only ready photos are returned."""
        GamePhoto.objects.create(
            path='photos/games/test-game/ready.png', game=self.game, ready=True
        )
        GamePhoto.objects.create(
            path='photos/games/test-game/not-ready.png', game=self.game, ready=False
        )
        response = self.client.get('/games/test-game/photos.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['path'] == 'photos/games/test-game/ready.png'

    def test_returns_only_game_photos(self):
        """Test that only photos linked to the game are returned."""
        photo = GamePhoto.objects.create(
            path='photos/games/test-game/mine.png', game=self.game, ready=True
        )
        GamePhoto.objects.create(
            path='photos/games/other-game/theirs.png', game=self.other_game, ready=True
        )
        response = self.client.get('/games/test-game/photos.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == photo.id

    def test_returns_id_and_path_fields(self):
        """Test that list items include id and path fields."""
        photo = GamePhoto.objects.create(
            path='photos/games/test-game/cover.png', game=self.game, ready=True
        )
        response = self.client.get('/games/test-game/photos.json')
        data = json.loads(response.content)
        assert data[0]['id'] == photo.id
        assert data[0]['path'] == 'photos/games/test-game/cover.png'

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/photos.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/photos.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/photos.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/photos.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GamePhoto.objects.create(
                path=f'photos/games/test-game/photo-{i}.png', game=self.game, ready=True
            )
        response = self.client.get('/games/test-game/photos.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            GamePhoto.objects.create(
                path=f'photos/games/test-game/photo-{i}.png', game=self.game, ready=True
            )
        response = self.client.get('/games/test-game/photos.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-photos', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200
