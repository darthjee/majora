"""Tests for the PlayerListSerializer."""

from django.test import TestCase

from games.serializers.games.players.player_list import PlayerListSerializer
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory


class TestPlayerListSerializer(TestCase):
    """Tests for the PlayerListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game with a DM-only player, a player with a PC, and no linked user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        player = PlayerFactory(name='Bob', game=self.game)
        data = PlayerListSerializer(player).data
        assert data['id'] == player.id

    def test_serializes_user_as_none_when_no_linked_user(self):
        """Test that user is None for a Player with no linked User account."""
        player = PlayerFactory(name='Bob', game=self.game)
        data = PlayerListSerializer(player).data
        assert data['user'] is None

    def test_serializes_user_when_linked(self):
        """Test that user is populated for a Player with a linked User account."""
        user = UserFactory(username='bob_user')
        player = PlayerFactory(name='Bob', game=self.game, user=user)
        data = PlayerListSerializer(player).data
        assert data['user'] is not None
        assert 'display_name' in data['user']
        assert 'photo_url' in data['user']

    def test_serializes_character_as_none_when_no_pc(self):
        """Test that character is None for a Player who owns no PC (e.g. the DM)."""
        player = PlayerFactory(name='Dungeon Master', game=self.game, is_dm=True)
        data = PlayerListSerializer(player).data
        assert data['character'] is None

    def test_serializes_character_when_owned(self):
        """Test that character is populated for a Player who owns a PC."""
        player = PlayerFactory(name='Bob', game=self.game)
        character = CharacterFactory(name='Aragorn', game=self.game, player=player, npc=False)
        data = PlayerListSerializer(player).data
        assert data['character'] is not None
        assert data['character']['name'] == character.name

    def test_ignores_npcs_when_resolving_character(self):
        """Test that an NPC linked to the player (edge case) is not treated as the PC."""
        player = PlayerFactory(name='Bob', game=self.game)
        CharacterFactory(name='Random NPC', game=self.game, player=player, npc=True)
        data = PlayerListSerializer(player).data
        assert data['character'] is None
