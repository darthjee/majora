"""Shared implementation for the character treasures-list endpoint."""

from django.db.models import Exists, IntegerField, OuterRef, Subquery
from django.db.models.functions import Coalesce

from ...models import GameTreasure
from ...serializers import CharacterTreasureSerializer
from ..common import paginated_list_response
from ..games._treasure_context import game_treasures_context
from ._shared import _get_character_or_404, _hidden_gate_response


def character_treasures(
    request, game, character_id, npc, check_hidden, allow_hidden=False,
    serializer_class=CharacterTreasureSerializer,
):
    """Return a paginated list of treasures held by a specific character in a game.

    When `check_hidden` is True, a hidden character is gated behind the requester's edit
    permission and the response carries `X-Skip-Cache` when the character is hidden; when
    False, neither behavior applies. This is unrelated to `allow_hidden`, which instead
    controls whether an NPC's *held treasures* that are themselves hidden (per the game's
    `GameTreasure.hidden`) are filtered out of the list — a separate, treasure-catalog-level
    concern from the character-level `hidden` gate above. Only applies when `npc` is True (a
    PC's own treasures list must keep showing everything it owns, per the issue); when
    `allow_hidden` is True (the DM-only `/treasures/all.json` variant), no such filtering
    happens even for an NPC. `serializer_class` defaults to `CharacterTreasureSerializer`;
    the DM-only `/treasures/all.json` variant passes `CharacterTreasureAllSerializer` instead,
    so `hidden` is only ever included in that DM-facing payload.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)
    if npc and not allow_hidden:
        treasures = _exclude_hidden_treasures(game, treasures)
    game_value = Subquery(
        GameTreasure.objects.filter(
            game=game, treasure=OuterRef('treasure_id'),
        ).values('value')[:1],
        output_field=IntegerField(),
    )
    treasures = treasures.annotate(game_value=Coalesce(game_value, 'treasure__value'))
    treasures = treasures.order_by('game_value', 'treasure__id')
    treasures = _filter_by_search(request, treasures)
    context = game_treasures_context(game)
    response = paginated_list_response(
        request, treasures, serializer_class, context=context,
    )
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def _exclude_hidden_treasures(game, treasures):
    """Exclude `treasures` (a CharacterTreasure queryset) whose GameTreasure is hidden."""
    hidden_game_treasure = GameTreasure.objects.filter(
        game=game, treasure=OuterRef('treasure_id'), hidden=True,
    )
    return treasures.exclude(Exists(hidden_game_treasure))


def _filter_by_search(request, treasures):
    """Filter `treasures` to a case-insensitive `treasure__name` substring match on `search`."""
    search = request.GET.get('search')
    if not search:
        return treasures

    return treasures.filter(treasure__name__icontains=search)
