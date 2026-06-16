"""Tests for games app views."""

import json

import pytest
from django.urls import reverse

from games.models import Character, Game, Link, Photo, Player


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


@pytest.mark.django_db
class TestGamePcsView:
    """Tests for the game PCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')

    def test_returns_only_pcs(self, client):
        """Test that only characters with npc=False are returned."""
        Character.objects.create(name='Hero', game=self.game, player=self.player, npc=False)
        Character.objects.create(name='Villain', game=self.game)
        response = client.get('/games/test-game/pcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Hero'

    def test_returns_empty_list_when_no_pcs(self, client):
        """Test that an empty list is returned when there are no PCs."""
        response = client.get('/games/test-game/pcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game/pcs.json')
        assert response.status_code == 404


@pytest.mark.django_db
class TestGameNpcsView:
    """Tests for the game NPCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')

    def test_returns_only_npcs(self, client):
        """Test that only characters with npc=True are returned."""
        Character.objects.create(name='Hero', game=self.game, player=self.player, npc=False)
        Character.objects.create(name='Villain', game=self.game)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Villain'

    def test_returns_empty_list_when_no_npcs(self, client):
        """Test that an empty list is returned when there are no NPCs."""
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []


@pytest.mark.django_db
class TestCharacterDetailView:
    """Tests for the character detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.character = Character.objects.create(
            name='Aragorn',
            game=self.game,
            player=self.player,
            character_class='Ranger',
            level=20,
            description='The future king of Gondor.',
            npc=False,
        )

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = client.get(f'/games/test-game/characters/{self.character.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Aragorn'
        assert data['character_class'] == 'Ranger'
        assert data['level'] == 20
        assert data['is_pc'] is True

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/characters/99999.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/characters/{self.character.id}.json')
        assert response.status_code == 404

    def test_npc_is_pc_is_false(self, client):
        """Test that is_pc is False for NPCs."""
        npc = Character.objects.create(name='Gandalf', game=self.game)
        response = client.get(f'/games/test-game/characters/{npc.id}.json')
        data = json.loads(response.content)
        assert data['is_pc'] is False

    def test_includes_photos(self, client):
        """Test that character detail includes associated photos."""
        Photo.objects.create(
            url='http://example.com/aragorn.png', character=self.character
        )
        response = client.get(f'/games/test-game/characters/{self.character.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['url'] == 'http://example.com/aragorn.png'

    def test_character_class_is_null_when_not_set(self, client):
        """Test that character_class is null in the response when not set."""
        npc = Character.objects.create(name='Unnamed NPC', game=self.game, character_class=None)
        response = client.get(f'/games/test-game/characters/{npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['character_class'] is None
