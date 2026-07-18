"""Tests for the MessageVisualisation model."""

import pytest
from django.db import IntegrityError, transaction

from conversations.models import MessageVisualisation
from games.tests.factories import GameFactory, PlayerFactory


@pytest.mark.django_db
class TestMessageVisualisation:
    """Tests for the MessageVisualisation model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.owner = PlayerFactory(name='Alice', game=self.game)
        self.player = PlayerFactory(name='Bob', game=self.game)
        self.conversation = self.owner.owned_conversations.create(title='Party Chat')
        self.message = self.conversation.messages.create(player=self.owner, body='Hi')

    def test_message_visualisation_creation(self):
        """Test that a visualisation can be created linking a message and a player."""
        visualisation = MessageVisualisation.objects.create(
            message=self.message, player=self.player,
        )
        assert visualisation.message == self.message
        assert visualisation.player == self.player

    def test_not_seen_defaults_to_false(self):
        """Test that not_seen defaults to False when not specified."""
        visualisation = MessageVisualisation.objects.create(
            message=self.message, player=self.player,
        )
        assert visualisation.not_seen is False

    def test_not_seen_can_be_overridden(self):
        """Test that not_seen can be explicitly set to True."""
        visualisation = MessageVisualisation.objects.create(
            message=self.message, player=self.player, not_seen=True,
        )
        assert visualisation.not_seen is True

    def test_message_visualisation_str(self):
        """Test string representation of a message visualisation."""
        visualisation = MessageVisualisation(message=self.message, player=self.player)
        assert str(visualisation) == (
            f'MessageVisualisation(message={self.message.id}, player={self.player.id})'
        )

    def test_visualisations_related_name_on_message(self):
        """Test that visualisations can be accessed via the message's related name."""
        MessageVisualisation.objects.create(message=self.message, player=self.player)
        assert self.message.visualisations.count() == 1

    def test_message_visualisations_related_name_on_player(self):
        """Test that visualisations can be accessed via the player's related name."""
        MessageVisualisation.objects.create(message=self.message, player=self.player)
        assert self.player.message_visualisations.count() == 1

    def test_duplicate_visualisation_raises_integrity_error(self):
        """Test that a second row for the same message/player pair is rejected."""
        MessageVisualisation.objects.create(message=self.message, player=self.player)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                MessageVisualisation.objects.create(message=self.message, player=self.player)

    def test_deleting_message_cascades_to_visualisation(self):
        """Test that deleting a message deletes its visualisations."""
        visualisation = MessageVisualisation.objects.create(
            message=self.message, player=self.player,
        )
        self.message.delete()
        assert not MessageVisualisation.objects.filter(id=visualisation.id).exists()

    def test_deleting_player_cascades_to_visualisation(self):
        """Test that deleting a player deletes its visualisations."""
        visualisation = MessageVisualisation.objects.create(
            message=self.message, player=self.player,
        )
        self.player.delete()
        assert not MessageVisualisation.objects.filter(id=visualisation.id).exists()
