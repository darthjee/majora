"""Factories for `Conversation`, `ConversationParticipant`, `Message` and `MessageVisualisation`."""

import factory

from conversations.models import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageVisualisation,
)
from games.tests.factories.game import PlayerFactory


class ConversationFactory(factory.django.DjangoModelFactory):
    """Factory for Conversation."""

    class Meta:
        """Factory configuration."""

        model = Conversation

    title = 'Test Conversation'
    owner = factory.SubFactory(PlayerFactory)


class ConversationParticipantFactory(factory.django.DjangoModelFactory):
    """Factory for ConversationParticipant."""

    class Meta:
        """Factory configuration."""

        model = ConversationParticipant

    conversation = factory.SubFactory(ConversationFactory)
    player = factory.SubFactory(PlayerFactory)


class MessageFactory(factory.django.DjangoModelFactory):
    """Factory for Message."""

    class Meta:
        """Factory configuration."""

        model = Message

    conversation = factory.SubFactory(ConversationFactory)
    player = factory.SubFactory(PlayerFactory)
    body = 'Test message body.'


class MessageVisualisationFactory(factory.django.DjangoModelFactory):
    """Factory for MessageVisualisation."""

    class Meta:
        """Factory configuration."""

        model = MessageVisualisation

    message = factory.SubFactory(MessageFactory)
    player = factory.SubFactory(PlayerFactory)
    not_seen = False
