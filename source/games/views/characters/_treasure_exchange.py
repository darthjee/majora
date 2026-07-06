"""Shared implementation for the character treasure acquire/sell endpoints."""

from django.db import transaction
from django.db.models import Q
from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from ...models import Character, CharacterTreasure, Treasure
from ...permissions import CharacterEditPermission
from ..common import validated_or_error


class _TreasureExchangeSerializer(serializers.Serializer):
    """Validate the treasure_id/quantity payload shared by acquire and sell requests."""

    treasure_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


def character_treasure_acquire(request, game, character):
    """Spend `character`'s money to acquire a quantity of a treasure available in `game`."""
    error_response, treasure, quantity = _authorize_and_parse(request, game, character)
    if error_response:
        return error_response

    return _acquire(character, treasure, quantity)


def character_treasure_sell(request, game, character):
    """Sell a quantity of a treasure `character` owns, refunding its value into money."""
    error_response, treasure, quantity = _authorize_and_parse(request, game, character)
    if error_response:
        return error_response

    return _sell(character, treasure, quantity)


def _authorize_and_parse(request, game, character):
    """Check edit permission and validate/resolve the treasure_id/quantity payload.

    Returns a `(error_response, treasure, quantity)` tuple; `error_response` is `None` on
    success, in which case `treasure` and `quantity` are populated.
    """
    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response, None, None

    serializer = _TreasureExchangeSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response, None, None

    treasure = _find_game_treasure(game, serializer.validated_data['treasure_id'])
    return None, treasure, serializer.validated_data['quantity']


def _find_game_treasure(game, treasure_id):
    """Return the Treasure matching `treasure_id` scoped to `game`, or raise Http404."""
    treasure = Treasure.objects.filter(
        Q(linked_game=game) | Q(game=game), id=treasure_id,
    ).distinct().first()
    if treasure is None:
        raise Http404
    return treasure


def _acquire(character, treasure, quantity):
    """Atomically add `quantity` of `treasure` to `character`, charging their money."""
    with transaction.atomic():
        character = _lock_character(character)
        cost = quantity * treasure.value
        if cost > character.money:
            return Response({'errors': {'quantity': ['insufficient funds']}}, status=400)

        character_treasure = _lock_or_create_character_treasure(character, treasure)
        character_treasure.quantity += quantity
        character_treasure.save()

        character.money -= cost
        character.save()

    return Response({'quantity': character_treasure.quantity, 'money': character.money})


def _sell(character, treasure, quantity):
    """Atomically remove `quantity` of `treasure` from `character`, refunding their money."""
    with transaction.atomic():
        character = _lock_character(character)
        character_treasure = _lock_character_treasure(character, treasure)
        if character_treasure is None:
            raise Http404

        if quantity > character_treasure.quantity:
            return Response({'errors': {'quantity': ['not enough owned']}}, status=400)

        character_treasure.quantity -= quantity
        character_treasure.save()

        character.money += quantity * treasure.value
        character.save()

    return Response({'quantity': character_treasure.quantity, 'money': character.money})


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
