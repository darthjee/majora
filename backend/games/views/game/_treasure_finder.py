"""Treasure lookup helpers shared by the character treasure exchange endpoints."""

from django.http import Http404

from ...models import GameTreasure, Treasure


def _find_game_treasure(game, treasure_id, allow_hidden=False):
    """Return the Treasure matching `treasure_id` scoped to `game`, or raise Http404.

    Also 404s when the treasure's `GameTreasure` row for `game` is hidden, unless
    `allow_hidden` is `True` (the DM-only `/buy/all.json` variant).
    """
    treasure = Treasure.objects.for_game(game).filter(id=treasure_id).first()
    if treasure is None:
        raise Http404
    if not allow_hidden and _is_hidden(game, treasure):
        raise Http404
    return treasure


def _is_hidden(game, treasure):
    """Return whether `treasure`'s GameTreasure row for `game` is hidden."""
    game_treasure = GameTreasure.objects.filter(game=game, treasure=treasure).first()
    return game_treasure is not None and game_treasure.hidden


def _find_treasure_by_id(treasure_id):
    """Return the Treasure matching `treasure_id`, unscoped by game, or raise Http404.

    Used by sell, where a character may already own a treasure that has since been delisted
    from the game's catalog; ownership (not catalog membership) is the real authorization
    check, performed separately by `_lock_character_treasure`.
    """
    treasure = Treasure.objects.filter(id=treasure_id).first()
    if treasure is None:
        raise Http404
    return treasure
