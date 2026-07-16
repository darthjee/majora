"""Shared helper for resolving a character's total treasure value."""

from django.db.models import Sum
from django.db.models.functions import Coalesce


def resolve_treasure_value(character):
    """Return `character`'s total treasure value.

    Uses the `treasure_value` queryset annotation when present (see
    `games.views.game._shared._with_treasure_value`) to avoid an extra query; otherwise falls
    back to aggregating `character_treasures__total_value` directly.
    """
    annotated = getattr(character, 'treasure_value', None)
    if annotated is not None:
        return annotated
    return character.character_treasures.aggregate(
        total=Coalesce(Sum('total_value'), 0)
    )['total']
