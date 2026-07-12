"""Tests for the GameMasterSerializer."""

import pytest

from games.serializers import GameMasterSerializer
from games.tests.factories import GameFactory, GameMasterFactory, UserFactory


@pytest.mark.django_db
class TestGameMasterSerializer:
    """Tests for the GameMasterSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.user = UserFactory(username='dm', password='secret-password')
        self.game_master = GameMasterFactory(game=self.game, user=self.user)

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
