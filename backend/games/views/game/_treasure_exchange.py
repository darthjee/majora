"""Shared implementation for the character treasure acquire/sell endpoints."""

from functools import partial

from django.db import transaction
from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from ...models import Character, CharacterTreasure, GameTreasure, Treasure
from ...permissions import CharacterTreasureExchangePermission
from ...serializers.games.treasures.game_treasure_fields import resolve_treasure_value
from ..common import validated_or_error


class _TreasureExchangeSerializer(serializers.Serializer):
    """Validate the treasure_id/quantity payload shared by acquire and sell requests."""

    treasure_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


def character_treasure_acquire(request, game, character, allow_hidden=False):
    """Spend `character`'s money to acquire a quantity of a treasure available in `game`.

    `allow_hidden` bypasses the hidden-treasure 404 gate — reserved for the DM-only
    `/acquire/all.json` endpoints; the regular player-facing acquire endpoints must always
    call this with the default `False` so a hidden treasure stays inaccessible to players.
    """
    resolve_treasure = partial(_find_game_treasure, game, allow_hidden=allow_hidden)
    error_response, treasure, quantity = _authorize_and_parse(
        request, character, resolve_treasure,
    )
    if error_response:
        return error_response

    return _acquire(character, treasure, quantity, game)


def character_treasure_sell(request, game, character):
    """Sell a quantity of a treasure `character` owns, refunding its value into money."""
    error_response, treasure, quantity = _authorize_and_parse(
        request, character, _find_treasure_by_id,
    )
    if error_response:
        return error_response

    return _sell(character, treasure, quantity, game)


def _authorize_and_parse(request, character, resolve_treasure):
    """Check edit permission and validate/resolve the treasure_id/quantity payload.

    `resolve_treasure` is called with `treasure_id` to resolve the treasure, allowing callers
    to scope the lookup differently (e.g. acquire is scoped to the game's catalog, sell is not).

    Returns a `(error_response, treasure, quantity)` tuple; `error_response` is `None` on
    success, in which case `treasure` and `quantity` are populated.
    """
    error_response = CharacterTreasureExchangePermission.check(request, character)
    if error_response:
        return error_response, None, None

    serializer = _TreasureExchangeSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response, None, None

    treasure = resolve_treasure(serializer.validated_data['treasure_id'])
    return None, treasure, serializer.validated_data['quantity']


def _find_game_treasure(game, treasure_id, allow_hidden=False):
    """Return the Treasure matching `treasure_id` scoped to `game`, or raise Http404.

    Also 404s when the treasure's `GameTreasure` row for `game` is hidden, unless
    `allow_hidden` is `True` (the DM-only `/acquire/all.json` variant).
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


def _resolve_value(game, treasure, game_treasure):
    """Return `treasure`'s effective value in `game`, reusing an already-fetched `game_treasure`.

    Delegates to the shared `resolve_treasure_value()`, prefetching `game_treasure` into its
    context so it doesn't re-query — `game_treasure` may already be locked (`select_for_update`)
    by the caller.
    """
    context = {'game': game, 'game_treasures_by_treasure_id': {treasure.id: game_treasure}}
    return resolve_treasure_value(context, treasure)


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


def _acquire(character, treasure, quantity, game):
    """Atomically add up to `quantity` of `treasure` to `character`, charging their money.

    When `treasure` is linked to `game` with a stock cap, the acquired amount is capped at
    the currently available units instead of rejecting an over-sized request.
    """
    with transaction.atomic():
        character = _lock_character(character)
        game_treasure = _lock_game_treasure(game, treasure)
        acquired = _capped_quantity(quantity, game_treasure)
        value = _resolve_value(game, treasure, game_treasure)
        cost = acquired * value
        if cost > character.money:
            return Response({'errors': {'quantity': ['insufficient funds']}}, status=400)

        character_treasure = _lock_or_create_character_treasure(character, treasure)
        character_treasure.quantity += acquired
        character_treasure.total_value = character_treasure.quantity * value
        character_treasure.save()

        character.money -= cost
        character.save()

        _record_acquired_units(game_treasure, acquired)

    return Response({
        'quantity': character_treasure.quantity, 'money': character.money, 'acquired': acquired,
    })


def _capped_quantity(quantity, game_treasure):
    """Return `quantity` capped at `game_treasure`'s available units, when it has a cap."""
    if game_treasure is None or game_treasure.available_units is None:
        return quantity
    return min(quantity, game_treasure.available_units)


def _record_acquired_units(game_treasure, acquired):
    """Persist the increment of `acquired` units onto `game_treasure`, if it exists."""
    if game_treasure is None:
        return
    game_treasure.acquired_units += acquired
    game_treasure.save()


def _sell(character, treasure, quantity, game):
    """Atomically remove `quantity` of `treasure` from `character`, refunding their value."""
    with transaction.atomic():
        character = _lock_character(character)
        character_treasure = _lock_character_treasure(character, treasure)
        if character_treasure is None:
            raise Http404

        if quantity > character_treasure.quantity:
            return Response({'errors': {'quantity': ['not enough owned']}}, status=400)

        game_treasure = _lock_game_treasure(game, treasure)
        value = _resolve_value(game, treasure, game_treasure)

        character_treasure.quantity -= quantity
        character_treasure.total_value = character_treasure.quantity * value
        character_treasure.save()

        character.money += quantity * value
        character.save()

        _release_acquired_units(game_treasure, quantity)

    return Response({'quantity': character_treasure.quantity, 'money': character.money})


def _release_acquired_units(game_treasure, quantity):
    """Persist the decrement of `quantity` units from `game_treasure`'s acquired_units, if any."""
    if game_treasure is None:
        return
    game_treasure.acquired_units = max(game_treasure.acquired_units - quantity, 0)
    game_treasure.save()


def _lock_game_treasure(game, treasure):
    """Return the locked GameTreasure row linking `game` and `treasure`, or None."""
    return GameTreasure.objects.select_for_update().filter(game=game, treasure=treasure).first()


def _lock_character(character):
    """Return `character` re-fetched with a row lock, to guard against concurrent updates."""
    return Character.objects.select_for_update().get(pk=character.pk)


def _lock_character_treasure(character, treasure):
    """Return the locked CharacterTreasure row for `character`/`treasure`, or `None`."""
    return CharacterTreasure.objects.select_for_update().filter(
        character=character, treasure=treasure,
    ).first()


def _lock_or_create_character_treasure(character, treasure):
    """Return the locked CharacterTreasure row for `character`/`treasure`, creating it if needed."""
    character_treasure = _lock_character_treasure(character, treasure)
    if character_treasure is not None:
        return character_treasure
    return CharacterTreasure.objects.create(character=character, treasure=treasure)
