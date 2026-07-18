"""Tests for the Conversation model."""

import pytest

from conversations.models import Conversation
from games.tests.factories import GameFactory, PlayerFactory


@pytest.mark.django_db
class TestConversation:
    """Tests for the Conversation model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.owner = PlayerFactory(name='Alice', game=self.game)

    def test_conversation_creation(self):
        """Test that a conversation can be created with a title and an owner."""
        conversation = Conversation.objects.create(title='Party Chat', owner=self.owner)
        assert conversation.title == 'Party Chat'
        assert conversation.owner == self.owner

    def test_conversation_str(self):
        """Test string representation of a conversation."""
        conversation = Conversation(title='Party Chat', owner=self.owner)
        assert str(conversation) == 'Party Chat'

    def test_owned_conversations_related_name(self):
        """Test that conversations can be accessed via the owner's related name."""
        Conversation.objects.create(title='Party Chat', owner=self.owner)
        assert self.owner.owned_conversations.count() == 1

    def test_deleting_owner_cascades_to_conversation(self):
        """Test that deleting the owner player deletes the conversation."""
        conversation = Conversation.objects.create(title='Party Chat', owner=self.owner)
        self.owner.delete()
        assert not Conversation.objects.filter(id=conversation.id).exists()
