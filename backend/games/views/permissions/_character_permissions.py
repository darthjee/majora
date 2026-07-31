"""Shared logic for the entity-agnostic PC/NPC permissions endpoints (issue #926)."""

from ...serializers import CharacterPermissionsSerializer
from ..common import parse_role_booleans, permissions_response


def character_permissions_response(request, npc):
    """Return the role-simulated permissions Response for a PC (`npc=False`) or NPC.

    Passes the `npc` flag through as `context_extra`, since `CharacterPermissionsSerializer`
    has no real character to derive it from (see `CharacterPermissionsSerializer._page_key`).
    """
    role_booleans = parse_role_booleans(request)
    return permissions_response(
        CharacterPermissionsSerializer, None, request, role_booleans, context_extra={'npc': npc},
    )
