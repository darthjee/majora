"""Dispatch mechanism for entity-specific behavior when a poll closes.

`Poll.content_object` may link a poll to an arbitrary entity (e.g. a `GameSession`). This
registry maps an entity's model class to the processor responsible for reacting to that
poll's closing, keeping `PollCloseWriter` itself entity-agnostic.
"""

from games.models import GameSession
from games.poll_close_processors.session_close_processor import GameSessionCloseProcessor

#: Maps a linked entity's model class to the processor handling its poll-close behavior.
_PROCESSORS = {
    GameSession: GameSessionCloseProcessor.process,
}


def process(poll, winner):
    """Dispatch `poll`'s close processing to the processor registered for its linked entity.

    No-ops when the poll has no linked entity, or when its entity type has no registered
    processor.
    """
    entity = poll.content_object
    if entity is None:
        return
    processor = _PROCESSORS.get(type(entity))
    if processor is None:
        return
    processor(entity, winner)
