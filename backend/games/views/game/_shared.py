"""Private helpers shared across character view modules."""

from django.http import Http404
from rest_framework.response import Response

from ...models import Character


def _find_character(game, character_id, npc):
    """Return the character matching game/id/npc, or None if not found."""
    if game is None:
        return None
    return Character.objects.filter(id=character_id, game=game, npc=npc).first()


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


def _filter_characters(
    request, queryset, allegiance_field='public_allegiance', slain_field='public_slain',
    hidden_field=None,
):
    """Narrow `queryset` by the optional `slain`/`name`/`allegiance`/`hidden` query params."""
    slain = request.query_params.get('slain')
    if slain is not None and slain.lower() in ('true', 'false'):
        queryset = queryset.filter(**{slain_field: (slain.lower() == 'true')})

    name = request.query_params.get('name')
    if name:
        queryset = queryset.filter(name__icontains=name)

    allegiance = request.query_params.get('allegiance')
    allowed_allegiances = (
        Character.ALLEGIANCE_ALLY,
        Character.ALLEGIANCE_ENEMY,
        Character.ALLEGIANCE_NEUTRAL,
    )
    if allegiance in allowed_allegiances:
        queryset = queryset.filter(**{allegiance_field: allegiance})

    if hidden_field:
        hidden = request.query_params.get('hidden')
        if hidden is not None and hidden.lower() in ('true', 'false'):
            queryset = queryset.filter(**{hidden_field: (hidden.lower() == 'true')})

    return queryset
