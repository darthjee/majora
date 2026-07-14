"""Tests for the GameMasterSerializer."""

from django.test import TestCase

from games.serializers import GameMasterSerializer
from games.tests.factories import GameFactory, GameMasterFactory, UserFactory


class TestGameMasterSerializer(TestCase):
    """Tests for the GameMasterSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.user = UserFactory(username='dm', password='secret-password')
        cls.game_master = GameMasterFactory(game=cls.game, user=cls.user)

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameMasterSerializer(self.game_master).data
        assert data['id'] == self.game_master.id

    def test_serializes_user(self):
        """Test that the user field is serialized as the user's id."""
        data = GameMasterSerializer(self.game_master).data
        assert data['user'] == self.user.id

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = GameMasterSerializer(self.game_master).data
        assert 'game' not in data
