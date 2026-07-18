"""Tests for the Message model."""

import pytest

from conversations.models import Message
from games.tests.factories import GameFactory, PlayerFactory


@pytest.mark.django_db
class TestMessage:
    """Tests for the Message model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.owner = PlayerFactory(name='Alice', game=self.game)
        self.conversation = self.owner.owned_conversations.create(title='Party Chat')

    def test_message_creation(self):
        """Test that a message can be created with a conversation, player, and body."""
        message = Message.objects.create(
            conversation=self.conversation, player=self.owner, body='Hello there',
        )
        assert message.conversation == self.conversation
        assert message.player == self.owner
        assert message.body == 'Hello there'

    def test_created_at_is_set_automatically(self):
        """Test that created_at is populated on creation."""
        message = Message.objects.create(
            conversation=self.conversation, player=self.owner, body='Hello there',
        )
        assert message.created_at is not None

    def test_message_str(self):
        """Test string representation of a message."""
        message = Message(conversation=self.conversation, player=self.owner, body='Hi')
        assert str(message) == (
            f'Message(conversation={self.conversation.id}, player={self.owner.id})'
        )

    def test_message_ordering(self):
        """Test that messages are ordered by id descending (most recent first)."""
        first = Message.objects.create(
            conversation=self.conversation, player=self.owner, body='First',
        )
        second = Message.objects.create(
            conversation=self.conversation, player=self.owner, body='Second',
        )
        messages = list(Message.objects.all())
        assert messages[0].id == second.id
        assert messages[1].id == first.id

    def test_messages_related_name_on_conversation(self):
        """Test that messages can be accessed via the conversation's related name."""
        Message.objects.create(conversation=self.conversation, player=self.owner, body='Hi')
        assert self.conversation.messages.count() == 1

    def test_sent_messages_related_name_on_player(self):
        """Test that messages can be accessed via the sender's related name."""
        Message.objects.create(conversation=self.conversation, player=self.owner, body='Hi')
        assert self.owner.sent_messages.count() == 1

    def test_deleting_conversation_cascades_to_message(self):
        """Test that deleting a conversation deletes its messages."""
        message = Message.objects.create(
            conversation=self.conversation, player=self.owner, body='Hi',
        )
        self.conversation.delete()
        assert not Message.objects.filter(id=message.id).exists()

    def test_deleting_player_cascades_to_message(self):
        """Test that deleting the sender player deletes the message."""
        message = Message.objects.create(
            conversation=self.conversation, player=self.owner, body='Hi',
        )
        self.owner.delete()
        assert not Message.objects.filter(id=message.id).exists()
