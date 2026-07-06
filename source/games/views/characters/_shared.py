"""Private helpers shared across character view modules."""

from rest_framework.response import Response

from ...models import Character


def _find_character(game, character_id, npc):
    """Return the character matching game/id/npc, or None if not found."""
    if game is None:
        return None
    return Character.objects.filter(id=character_id, game=game, npc=npc).first()


def _hidden_gate_response(character, request):
    """Return a 404 Response with X-Skip-Cache set if character is hidden and not editable."""
    if character.hidden and not character.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None
