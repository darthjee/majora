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
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_no_pcs(self, client):
        """Test that an empty list is returned when there are no PCs."""
        response = client.get('/games/test-game/pcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game/pcs.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/pcs.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/pcs.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/pcs.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Character.objects.create(
                name=f'Hero {i}', game=self.game, player=self.player, npc=False
            )
        response = client.get('/games/test-game/pcs.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Character.objects.create(
                name=f'Hero {i}', game=self.game, player=self.player, npc=False
            )
        response = client.get('/games/test-game/pcs.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


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
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_no_npcs(self, client):
        """Test that an empty list is returned when there are no NPCs."""
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/npcs.json?per_page=5')
        assert response['per_page'] == '5'

    def test_response_includes_total_header(self, client):
        """Test that the response includes the total item count header."""
        for i in range(3):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '3'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_default_page_size_uses_settings(self, client, monkeypatch):
        """Test that default per_page comes from Settings.pagination_size()."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '3')
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['per_page'] == '3'
        data = json.loads(response.content)
        assert len(data) == 3


@pytest.mark.django_db
class TestGameNpcDetailView:
    """Tests for the NPC detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.npc = Character.objects.create(
            name='Gandalf',
            game=self.game,
            character_class='Wizard',
            level=20,
            description='A wandering wizard.',
            npc=True,
        )

    def test_returns_character_detail(self, client):
        """Test that character detail is returned for a valid character_id."""
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Gandalf'
        assert data['character_class'] == 'Wizard'
        assert data['level'] == 20
        assert data['is_pc'] is False
        assert data['game_slug'] == 'test-game'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.npc.id}.json')
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        response = client.get(f'/games/test-game/npcs/{pc.id}.json')
        assert response.status_code == 404

    def test_includes_photos(self, client):
        """Test that character detail includes associated photos."""
        Photo.objects.create(url='http://example.com/gandalf.png', character=self.npc)
        response = client.get(f'/games/test-game/npcs/{self.npc.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['url'] == 'http://example.com/gandalf.png'

    def test_character_class_is_null_when_not_set(self, client):
        """Test that character_class is null in the response when not set."""
        npc = Character.objects.create(
            name='Unnamed NPC', game=self.game, character_class=None, npc=True
        )
        response = client.get(f'/games/test-game/npcs/{npc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['character_class'] is None


@pytest.mark.django_db
class TestGamePcDetailView:
    """Tests for the PC detail endpoint."""

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
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Aragorn'
        assert data['character_class'] == 'Ranger'
        assert data['level'] == 20
        assert data['is_pc'] is True
        assert data['game_slug'] == 'test-game'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/pcs/99999.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/pcs/{self.character.id}.json')
        assert response.status_code == 404

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = client.get(f'/games/test-game/pcs/{npc.id}.json')
        assert response.status_code == 404

    def test_includes_photos(self, client):
        """Test that character detail includes associated photos."""
        Photo.objects.create(
            url='http://example.com/aragorn.png', character=self.character
        )
        response = client.get(f'/games/test-game/pcs/{self.character.id}.json')
        data = json.loads(response.content)
        assert len(data['photos']) == 1
        assert data['photos'][0]['url'] == 'http://example.com/aragorn.png'

    def test_character_class_is_null_when_not_set(self, client):
        """Test that character_class is null in the response when not set."""
        pc = Character.objects.create(
            name='Unnamed PC',
            game=self.game,
            player=self.player,
            character_class=None,
            npc=False,
        )
        response = client.get(f'/games/test-game/pcs/{pc.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['character_class'] is None
