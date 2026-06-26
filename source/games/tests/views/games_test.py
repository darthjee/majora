"""Tests for games views."""

import json

import pytest
from django.urls import reverse

from games.models import Game, Link


@pytest.mark.django_db
class TestGamesListView:
    """Tests for the games list endpoint."""

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no games exist."""
        response = client.get('/games.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_games(self, client):
        """Test that created games are returned in the list."""
        Game.objects.create(name='Game One', game_slug='game-one')
        Game.objects.create(name='Game Two', game_slug='game-two')
        response = client.get('/games.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2
        slugs = [g['game_slug'] for g in data]
        assert 'game-one' in slugs
        assert 'game-two' in slugs

    def test_returns_photo_field(self, client):
        """Test that the photo field is included in the list response."""
        Game.objects.create(name='Visual Game', game_slug='visual-game', photo='http://example.com/cover.png')
        response = client.get('/games.json')
        data = json.loads(response.content)
        assert data[0]['photo'] == 'http://example.com/cover.png'

    def test_photo_field_is_null_when_not_set(self, client):
        """Test that photo is null in the response when not set."""
        Game.objects.create(name='No Photo', game_slug='no-photo')
        response = client.get('/games.json')
        data = json.loads(response.content)
        assert data[0]['photo'] is None

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('games-list')
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Game.objects.create(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


@pytest.mark.django_db
class TestGameDetailView:
    """Tests for the game detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')

    def test_returns_game_detail(self, client):
        """Test that game detail is returned for a valid game_slug."""
        response = client.get('/games/epic-quest.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Epic Quest'
        assert data['game_slug'] == 'epic-quest'
        assert 'photo' in data

    def test_returns_description_field(self, client):
        """Test that description is included in the detail response."""
        self.game.description = 'A heroic adventure in Middle Earth.'
        self.game.save()
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == 'A heroic adventure in Middle Earth.'

    def test_description_is_empty_string_when_not_set(self, client):
        """Test that description defaults to empty string."""
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == ''

    def test_returns_404_for_unknown_slug(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game.json')
        assert response.status_code == 404

    def test_includes_links(self, client):
        """Test that game detail includes associated links."""
        Link.objects.create(text='Rulebook', url='http://example.com/rules', game=self.game)
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert len(data['links']) == 1
        assert data['links'][0]['text'] == 'Rulebook'
