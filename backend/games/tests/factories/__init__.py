"""Factory Boy factories for building model instances in tests.

These factories are thin, behavior-preserving wrappers around
`Model.objects.create(...)` (and, for users, Django's `create_user`/
`create_superuser`, so passwords stay hashed). Any keyword argument passed to a
factory call overrides its default, so existing test intent (specific names,
roles, flags, etc.) is preserved by passing overrides at the call site.
"""

from games.tests.factories.character import CharacterFactory
from games.tests.factories.conversation import (
    ConversationFactory,
    ConversationParticipantFactory,
    MessageFactory,
    MessageVisualisationFactory,
)
from games.tests.factories.document import CharacterDocumentFactory, GameDocumentFactory
from games.tests.factories.faction import CharacterFactionFactory, GameFactionFactory
from games.tests.factories.game import GameFactory, PlayerFactory
from games.tests.factories.item import CharacterItemFactory, GameItemFactory
from games.tests.factories.poll import PollFactory, PollOptionFactory, PollVoteFactory
from games.tests.factories.possession import CharacterPossessionFactory, GamePossessionFactory
from games.tests.factories.treasure import GameTreasureFactory, TreasureFactory
from games.tests.factories.user import SuperUserFactory, UserFactory, UserProfileFactory

__all__ = [
    'CharacterDocumentFactory',
    'CharacterFactionFactory',
    'CharacterFactory',
    'CharacterItemFactory',
    'CharacterPossessionFactory',
    'ConversationFactory',
    'ConversationParticipantFactory',
    'GameDocumentFactory',
    'GameFactionFactory',
    'GameFactory',
    'GameItemFactory',
    'GamePossessionFactory',
    'GameTreasureFactory',
    'MessageFactory',
    'MessageVisualisationFactory',
    'PlayerFactory',
    'PollFactory',
    'PollOptionFactory',
    'PollVoteFactory',
    'SuperUserFactory',
    'TreasureFactory',
    'UserFactory',
    'UserProfileFactory',
]
