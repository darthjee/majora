"""Tests for games app models."""

import pytest
from django.utils.text import slugify

from games.models import Character, Game, Link, Photo, Player


@pytest.mark.django_db
class TestGame:
    """Tests for the Game model."""

    def test_game_creation(self):
        """Test that a game can be created with name and game_slug."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        assert game.name == 'Test Game'
        assert game.game_slug == 'test-game'

    def test_game_slug_auto_generated(self):
        """Test that game_slug is auto-generated from name when not provided."""
        game = Game(name='My RPG Campaign')
        game.save()
        assert game.game_slug == slugify('My RPG Campaign')

    def test_game_slug_unique(self):
        """Test that game_slug must be unique."""
        from django.db import IntegrityError

        Game.objects.create(name='Game One', game_slug='same-slug')
        with pytest.raises(IntegrityError):
            Game.objects.create(name='Game Two', game_slug='same-slug')

    def test_game_str(self):
        """Test string representation of a game."""
        game = Game(name='My Game', game_slug='my-game')
        assert str(game) == 'My Game'

    def test_game_ordering(self):
        """Test that games are ordered by id."""
        first = Game.objects.create(name='Zebra Game', game_slug='zebra-game')
        second = Game.objects.create(name='Alpha Game', game_slug='alpha-game')
        games = list(Game.objects.all())
        assert games[0].id == first.id
        assert games[1].id == second.id


@pytest.mark.django_db
class TestPlayer:
    """Tests for the Player model."""

    def test_player_creation(self):
        """Test that a player can be created with a name."""
        player = Player.objects.create(name='Alice')
        assert player.name == 'Alice'

    def test_player_str(self):
        """Test string representation of a player."""
        player = Player(name='Bob')
        assert str(player) == 'Bob'

    def test_player_can_join_game(self):
        """Test that a player can be associated with a game."""
        game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        player = Player.objects.create(name='Alice')
        player.games.add(game)
        assert game in player.games.all()
        assert player in game.players.all()


@pytest.mark.django_db
class TestCharacter:
    """Tests for the Character model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Test Player')

    def test_character_creation(self):
        """Test that a character can be created with required fields."""
        character = Character.objects.create(name='Aragorn', game=self.game)
        assert character.name == 'Aragorn'
        assert character.game == self.game

    def test_character_npc_defaults_to_true(self):
        """Test that npc defaults to True on new characters."""
        character = Character.objects.create(name='Gandalf', game=self.game)
        assert character.npc is True

    def test_character_is_npc_when_no_player(self):
        """Test that a character without a player is an NPC."""
        character = Character.objects.create(name='Gandalf', game=self.game)
        assert character.is_pc is False

    def test_character_is_pc_when_npc_false(self):
        """Test that is_pc returns True when npc is False."""
        character = Character.objects.create(name='Frodo', game=self.game, npc=False)
        assert character.is_pc is True

    def test_character_is_pc_when_player_set(self):
        """Test that a character with a player is a PC."""
        character = Character.objects.create(
            name='Frodo', game=self.game, player=self.player, npc=False
        )
        assert character.is_pc is True

    def test_character_optional_fields(self):
        """Test that a character can have optional fields set."""
        character = Character.objects.create(
            name='Legolas',
            game=self.game,
            avatar_url='http://example.com/legolas.png',
            character_class='Ranger',
            level=10,
            description='An elf ranger from Mirkwood.',
        )
        assert character.avatar_url == 'http://example.com/legolas.png'
        assert character.character_class == 'Ranger'
        assert character.level == 10
        assert 'elf ranger' in character.description

    def test_character_class_can_be_null(self):
        """Test that character_class can be set to None."""
        character = Character.objects.create(
            name='Mystery NPC', game=self.game, character_class=None
        )
        character.refresh_from_db()
        assert character.character_class is None

    def test_character_str(self):
        """Test string representation of a character."""
        character = Character(name='Gimli', game=self.game)
        assert str(character) == 'Gimli'


@pytest.mark.django_db
class TestPhoto:
    """Tests for the Photo model."""

    def test_photo_creation(self):
        """Test that a photo can be created for a character."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        character = Character.objects.create(name='Hero', game=game)
        photo = Photo.objects.create(
            url='http://example.com/photo.png', character=character
        )
        assert photo.url == 'http://example.com/photo.png'
        assert photo.character == character

    def test_photo_str(self):
        """Test string representation of a photo."""
        game = Game.objects.create(name='Test Game 2', game_slug='test-game-2')
        character = Character.objects.create(name='Hero', game=game)
        photo = Photo(url='http://example.com/img.jpg', character=character)
        assert str(photo) == 'http://example.com/img.jpg'


@pytest.mark.django_db
class TestLink:
    """Tests for the Link model."""

    def test_link_creation(self):
        """Test that a link can be created for a game."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        link = Link.objects.create(
            text='Rulebook', url='http://example.com/rules', game=game
        )
        assert link.text == 'Rulebook'
        assert link.url == 'http://example.com/rules'
        assert link.game == game

    def test_link_str(self):
        """Test string representation of a link."""
        game = Game.objects.create(name='Test Game 3', game_slug='test-game-3')
        link = Link(text='Map', url='http://example.com/map', game=game)
        assert str(link) == 'Map'
