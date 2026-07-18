"""Tests for the ConversationParticipant model."""

import pytest
from django.db import IntegrityError, transaction

from conversations.models import ConversationParticipant
from games.tests.factories import GameFactory, PlayerFactory


@pytest.mark.django_db
class TestConversationParticipant:
    """Tests for the ConversationParticipant model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.owner = PlayerFactory(name='Alice', game=self.game)
        self.player = PlayerFactory(name='Bob', game=self.game)
        self.conversation = self.owner.owned_conversations.create(title='Party Chat')

    def test_conversation_participant_creation(self):
        """Test that a participant can be created linking a conversation and a player."""
        participant = ConversationParticipant.objects.create(
            conversation=self.conversation, player=self.player,
        )
        assert participant.conversation == self.conversation
        assert participant.player == self.player

    def test_conversation_participant_str(self):
        """Test string representation of a conversation participant."""
        participant = ConversationParticipant(conversation=self.conversation, player=self.player)
        assert str(participant) == (
            f'ConversationParticipant(conversation={self.conversation.id}, '
            f'player={self.player.id})'
        )

    def test_participants_related_name_on_conversation(self):
        """Test that participants can be accessed via the conversation's related name."""
        ConversationParticipant.objects.create(conversation=self.conversation, player=self.player)
        assert self.conversation.participants.count() == 1

    def test_conversation_participations_related_name_on_player(self):
        """Test that participations can be accessed via the player's related name."""
        ConversationParticipant.objects.create(conversation=self.conversation, player=self.player)
        assert self.player.conversation_participations.count() == 1

    def test_duplicate_participant_raises_integrity_error(self):
        """Test that a second row for the same conversation/player pair is rejected."""
        ConversationParticipant.objects.create(conversation=self.conversation, player=self.player)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ConversationParticipant.objects.create(
                    conversation=self.conversation, player=self.player,
                )

    def test_deleting_conversation_cascades_to_participant(self):
        """Test that deleting a conversation deletes its participants."""
        participant = ConversationParticipant.objects.create(
            conversation=self.conversation, player=self.player,
        )
        self.conversation.delete()
        assert not ConversationParticipant.objects.filter(id=participant.id).exists()

    def test_deleting_player_cascades_to_participant(self):
        """Test that deleting a player deletes its participations."""
        participant = ConversationParticipant.objects.create(
            conversation=self.conversation, player=self.player,
        )
        self.player.delete()
        assert not ConversationParticipant.objects.filter(id=participant.id).exists()
