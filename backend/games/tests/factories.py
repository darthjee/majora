"""Factory Boy factories for building model instances in tests.

These factories are thin, behavior-preserving wrappers around
`Model.objects.create(...)` (and, for users, Django's `create_user`/
`create_superuser`, so passwords stay hashed). Any keyword argument passed to a
factory call overrides its default, so existing test intent (specific names,
roles, flags, etc.) is preserved by passing overrides at the call site.
"""

import factory
from django.contrib.auth.models import User

from accounts.models import UserProfile
from conversations.models import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageVisualisation,
)
from games.models import (
    Character,
    CharacterDocument,
    CharacterItem,
    Game,
    GameDocument,
    GameItem,
    GameTreasure,
    Player,
    Poll,
    PollOption,
    PollVote,
    Treasure,
)


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for regular Django users, created via `create_user` for password hashing.

    Every user built here gets an `approved` `UserProfile` (mirroring the migration that
    backfills every pre-existing user to `approved`), so pre-existing tests built before
    `UserProfile.status` existed keep authenticating successfully by default. Tests that
    specifically exercise `pending`/`denied` behavior override the status explicitly, e.g.
    via `UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)`.
    """

    class Meta:
        """Factory configuration."""

        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    password = 'secret-password'

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create the user through `create_user`, then attach an approved profile."""
        manager = cls._get_manager(model_class)
        user = manager.create_user(*args, **kwargs)
        _ensure_approved_profile(user)
        return user


class SuperUserFactory(UserFactory):
    """Factory for superusers, created via `create_superuser` for password hashing."""

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create the user through `create_superuser`, then attach an approved profile."""
        manager = cls._get_manager(model_class)
        user = manager.create_superuser(*args, **kwargs)
        _ensure_approved_profile(user)
        return user


def _ensure_approved_profile(user):
    """Create an `approved` `UserProfile` for `user` if it doesn't already have one.

    Looks up/creates by `user_id` rather than `user` on purpose: passing the `user` instance
    itself into `get_or_create`/`create` makes Django cache the new profile as `user`'s
    reverse `.profile` relation (OneToOneField relations are cached bidirectionally on
    assignment). Since callers keep reusing that same `user` object afterwards (e.g. a test's
    `cls.user`, later updated via `UserProfileFactory`), that stale cache would silently
    shadow any later change made straight through the database.
    """
    UserProfile.objects.get_or_create(
        user_id=user.pk, defaults={'status': UserProfile.STATUS_APPROVED},
    )


class UserProfileFactory(factory.django.DjangoModelFactory):
    """Factory for UserProfile, defaulting display_name to its linked user's username.

    Uses `update_or_create` (rather than a plain insert) because `UserFactory` already
    attaches an approved profile to every user it builds, so an explicit
    `UserProfileFactory(user=user, ...)` call updates that existing row instead of
    colliding with it on the `user` OneToOneField's uniqueness constraint.
    """

    class Meta:
        """Factory configuration."""

        model = UserProfile

    user = factory.SubFactory(UserFactory)
    display_name = factory.LazyAttribute(lambda o: o.user.username)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Update the user's existing profile (if any) rather than always inserting one.

        Looks up/creates by `user_id` (see `_ensure_approved_profile`'s docstring) so this
        never leaves a stale `.profile` cached on the `user` instance the caller passed in.
        """
        manager = cls._get_manager(model_class)
        user = kwargs.pop('user')
        profile, _ = manager.update_or_create(user_id=user.pk, defaults=kwargs)
        return profile


class GameFactory(factory.django.DjangoModelFactory):
    """Factory for Game."""

    class Meta:
        """Factory configuration."""

        model = Game

    name = 'Test Game'
    game_slug = factory.Sequence(lambda n: 'test-game' if n == 0 else f'test-game-{n}')


class PlayerFactory(factory.django.DjangoModelFactory):
    """Factory for Player."""

    class Meta:
        """Factory configuration."""

        model = Player

    name = 'Test Player'
    game = factory.SubFactory(GameFactory)


class CharacterFactory(factory.django.DjangoModelFactory):
    """Factory for Character, defaulting to an NPC (matching the model default)."""

    class Meta:
        """Factory configuration."""

        model = Character

    name = 'Test Character'
    game = factory.SubFactory(GameFactory)
    npc = True


class TreasureFactory(factory.django.DjangoModelFactory):
    """Factory for Treasure."""

    class Meta:
        """Factory configuration."""

        model = Treasure

    name = 'Test Treasure'
    value = 100


class GameTreasureFactory(factory.django.DjangoModelFactory):
    """Factory for GameTreasure, defaulting value to its linked treasure's value."""

    class Meta:
        """Factory configuration."""

        model = GameTreasure

    game = factory.SubFactory(GameFactory)
    treasure = factory.SubFactory(TreasureFactory)
    value = factory.LazyAttribute(lambda o: o.treasure.value)
    hidden = False


class GameItemFactory(factory.django.DjangoModelFactory):
    """Factory for GameItem."""

    class Meta:
        """Factory configuration."""

        model = GameItem

    game = factory.SubFactory(GameFactory)
    name = 'Test Item'
    description = 'A test item.'


class CharacterItemFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterItem."""

    class Meta:
        """Factory configuration."""

        model = CharacterItem

    character = factory.SubFactory(CharacterFactory)
    game_item = factory.SubFactory(GameItemFactory)


class GameDocumentFactory(factory.django.DjangoModelFactory):
    """Factory for GameDocument."""

    class Meta:
        """Factory configuration."""

        model = GameDocument

    game = factory.SubFactory(GameFactory)
    name = 'Test Document'
    description = 'A test document.'


class CharacterDocumentFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterDocument."""

    class Meta:
        """Factory configuration."""

        model = CharacterDocument

    character = factory.SubFactory(CharacterFactory)
    game_document = factory.SubFactory(GameDocumentFactory)


class PollFactory(factory.django.DjangoModelFactory):
    """Factory for Poll."""

    class Meta:
        """Factory configuration."""

        model = Poll

    game = factory.SubFactory(GameFactory)
    type = Poll.TYPE_SINGLE
    status = Poll.STATUS_OPEN


class PollOptionFactory(factory.django.DjangoModelFactory):
    """Factory for PollOption."""

    class Meta:
        """Factory configuration."""

        model = PollOption

    poll = factory.SubFactory(PollFactory)
    option = 'Test Option'


class PollVoteFactory(factory.django.DjangoModelFactory):
    """Factory for PollVote.

    `user` and `option` are independent sub-factories with no shared game by
    default, so `PollVote.clean()`'s game-membership check will fail unless the
    caller explicitly makes the user a player or game master of the poll's game
    (e.g. `player.game = poll.game; player.save()`) before building a valid vote.
    """

    class Meta:
        """Factory configuration."""

        model = PollVote

    user = factory.SubFactory(UserFactory)
    option = factory.SubFactory(PollOptionFactory)


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
