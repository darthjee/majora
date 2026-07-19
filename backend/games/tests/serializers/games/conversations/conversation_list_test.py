"""Tests for the ConversationListSerializer."""

from django.test import TestCase

from games.serializers.games.conversations.conversation_list import ConversationListSerializer
from games.tests.factories import ConversationFactory


class TestConversationListSerializer(TestCase):
    """Tests for the ConversationListSerializer."""

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        conversation = ConversationFactory(title='Party Chat')
        data = ConversationListSerializer(conversation).data
        assert data['id'] == conversation.id

    def test_serializes_title(self):
        """Test that the title field is serialized."""
        conversation = ConversationFactory(title='Party Chat')
        data = ConversationListSerializer(conversation).data
        assert data['title'] == 'Party Chat'

    def test_serializes_only_id_and_title(self):
        """Test that no other fields (e.g. owner, participants) are exposed."""
        conversation = ConversationFactory(title='Party Chat')
        data = ConversationListSerializer(conversation).data
        assert set(data.keys()) == {'id', 'title'}
