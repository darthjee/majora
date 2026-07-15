"""Tests for the GameSessionMessage model."""

from django.test import TestCase

from games.models import GameSession, GameSessionMessage
from games.tests.factories import GameFactory, PlayerFactory, UserFactory


class TestGameSessionMessage(TestCase):
    """Tests for the GameSessionMessage model."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, and a user for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_message_creation(self):
        """Test that a message can be created with content, session, and user."""
        message = GameSessionMessage.objects.create(
            session=self.session, user=self.user, content='Hello there'
        )
        assert message.session == self.session
        assert message.user == self.user
        assert message.content == 'Hello there'

    def test_player_defaults_to_none(self):
        """Test that player defaults to None when not provided."""
        message = GameSessionMessage.objects.create(
            session=self.session, user=self.user, content='Hello there'
        )
        assert message.player is None

    def test_message_creation_with_player(self):
        """Test that a message can be linked to a player."""
        player = PlayerFactory(name='Bob', user=self.user)
        message = GameSessionMessage.objects.create(
            session=self.session, user=self.user, player=player, content='Hello there'
        )
        assert message.player == player

    def test_created_at_is_set_automatically(self):
        """Test that created_at is populated on creation."""
        message = GameSessionMessage.objects.create(
            session=self.session, user=self.user, content='Hello there'
        )
        assert message.created_at is not None

    def test_message_ordering(self):
        """Test that messages are ordered by id descending (most recent first)."""
        first = GameSessionMessage.objects.create(
            session=self.session, user=self.user, content='First'
        )
        second = GameSessionMessage.objects.create(
            session=self.session, user=self.user, content='Second'
        )
        messages = list(GameSessionMessage.objects.all())
        assert messages[0].id == second.id
        assert messages[1].id == first.id

    def test_player_set_to_none_when_player_deleted(self):
        """Test that player is set to None when the linked Player is deleted."""
        player = PlayerFactory(name='Bob', user=self.user)
        message = GameSessionMessage.objects.create(
            session=self.session, user=self.user, player=player, content='Hello there'
        )
        player.delete()
        message.refresh_from_db()
        assert message.player is None

    def test_message_str(self):
        """Test string representation of a message."""
        message = GameSessionMessage(session=self.session, user=self.user, content='Hi')
        assert str(message) == (
            f'GameSessionMessage(session={self.session.id}, user={self.user.username})'
        )
