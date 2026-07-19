"""Private helpers shared across character view modules."""

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.http import Http404
from rest_framework.response import Response

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


def _hidden_gate_response(character, request):
    """Return a 404 Response with X-Skip-Cache set if character is hidden and not editable."""
    if character.hidden and not character.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None


def _filter_by_slain(request, queryset, slain_field):
    """Narrow `queryset` by the optional `slain` query param, when it's `true`/`false`."""
    slain = request.query_params.get('slain')
    if slain is not None and slain.lower() in ('true', 'false'):
        return queryset.filter(**{slain_field: (slain.lower() == 'true')})
    return queryset


def _filter_by_character_name(request, queryset):
    """Narrow `queryset` by a case-insensitive substring match on `name` from the `name` param."""
    name = request.query_params.get('name')
    if name:
        return queryset.filter(name__icontains=name)
    return queryset


def _filter_by_allegiance(request, queryset, allegiance_field):
    """Narrow `queryset` by the optional `allegiance` query param, when it's a recognized value."""
    allegiance = request.query_params.get('allegiance')
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
    request, queryset, allegiance_field='public_allegiance', slain_field='public_slain',
    hidden_field=None,
):
    """Narrow `queryset` by the optional `slain`/`name`/`allegiance`/`hidden` query params."""
    queryset = _filter_by_slain(request, queryset, slain_field)
    queryset = _filter_by_character_name(request, queryset)
    queryset = _filter_by_allegiance(request, queryset, allegiance_field)
    return _filter_by_hidden(request, queryset, hidden_field)
