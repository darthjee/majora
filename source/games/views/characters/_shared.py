"""Private helpers shared across character view modules."""

from ...models import Character


def _find_character(game, character_id, npc):
    """Return the character matching game/id/npc, or None if not found."""
    if game is None:
        return None
    return Character.objects.filter(id=character_id, game=game, npc=npc).first()
