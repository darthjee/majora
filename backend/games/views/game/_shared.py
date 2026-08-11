"""Private helpers shared across character view modules."""

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.http import Http404
from rest_framework.response import Response

from common.query_filters import filter_by_name as _common_filter_by_name

from ...models import Character


def _with_treasure_value(queryset):
    """Annotate `queryset` with `treasure_value`, the sum of each character's treasure rows."""
    return queryset.annotate(treasure_value=Coalesce(Sum('character_treasures__total_value'), 0))


def _find_character(game, character_id, npc):
    """Return the character matching game/id/npc, or None if not found."""
    if game is None:
        return None
    queryset = Character.objects.filter(id=character_id, game=game, npc=npc)
    return _with_treasure_value(queryset).first()


def _get_character_or_404(game, character_id, npc):
    """Return the character matching game/id/npc, raising Http404 if not found."""
    character = _find_character(game, character_id, npc)
    if character is None:
        raise Http404
    return character


def _character_resource(character):
    """Return the permissions resource name ('game_pc'/'game_npc') for `character`."""
    return 'game_pc' if character.is_pc else 'game_npc'


def _character_item_resource(character):
    """Return the permissions resource name ('game_pc_item'/'game_npc_item') for `character`."""
    return 'game_pc_item' if character.is_pc else 'game_npc_item'


def _character_document_resource(character):
    """Return the resource name ('game_pc_document'/'game_npc_document') for `character`."""
    return 'game_pc_document' if character.is_pc else 'game_npc_document'


def _hidden_gate_response(character, request):
    """Return a 404 Response with X-Skip-Cache set if character is hidden and not editable."""
    if character.hidden and not character.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None


def _filter_by_slain(request, queryset, slain_field):
    """Narrow `queryset` by `slain_field`, read from an identically-named query param."""
    slain = request.query_params.get(slain_field)
    if slain is not None and slain.lower() in ('true', 'false'):
        return queryset.filter(**{slain_field: (slain.lower() == 'true')})
    return queryset


def _filter_by_character_name(request, queryset):
    """Narrow `queryset` by a case-insensitive substring match on `name` from the `name` param."""
    return _common_filter_by_name(request, queryset)


def _filter_by_allegiance(request, queryset, allegiance_field):
    """Narrow `queryset` by `allegiance_field`, read from an identically-named query param."""
    allegiance = request.query_params.get(allegiance_field)
    allowed_allegiances = (
        Character.ALLEGIANCE_ALLY,
        Character.ALLEGIANCE_ENEMY,
        Character.ALLEGIANCE_NEUTRAL,
    )
    if allegiance in allowed_allegiances:
        return queryset.filter(**{allegiance_field: allegiance})
    return queryset


def _filter_by_hidden(request, queryset, hidden_field):
    """Narrow `queryset` by the optional `hidden` query param, when `hidden_field` is given."""
    if not hidden_field:
        return queryset
    hidden = request.query_params.get('hidden')
    if hidden is not None and hidden.lower() in ('true', 'false'):
        return queryset.filter(**{hidden_field: (hidden.lower() == 'true')})
    return queryset


def _filter_characters(
    request, queryset, allegiance_fields=('public_allegiance',), slain_fields=('public_slain',),
    hidden_field=None,
):
    """Narrow `queryset` by slain/name/allegiance/hidden query params.

    `slain_fields`/`allegiance_fields` list the model fields to filter by (each read from an
    identically-named query param), applied as an AND — e.g. passing both `public_slain` and
    `private_slain` filters on both independently.
    """
    for slain_field in slain_fields:
        queryset = _filter_by_slain(request, queryset, slain_field)
    queryset = _filter_by_character_name(request, queryset)
    for allegiance_field in allegiance_fields:
        queryset = _filter_by_allegiance(request, queryset, allegiance_field)
    return _filter_by_hidden(request, queryset, hidden_field)
