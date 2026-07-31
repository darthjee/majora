"""Shared logic for the entity-agnostic treasure permissions endpoints (issue #926)."""

from ...serializers import TreasurePermissionsSerializer
from ..common import parse_role_booleans, permissions_response


def treasure_permissions_response(request, scoped):
    """Return the role-simulated permissions Response for a global (`scoped=False`) or
    game-exclusive (`scoped=True`) treasure.

    Passes the `scoped` flag through as `context_extra`, since `TreasurePermissionsSerializer`
    has no real treasure to derive it from (see `TreasurePermissionsSerializer.to_representation`).
    """
    role_booleans = parse_role_booleans(request)
    return permissions_response(
        TreasurePermissionsSerializer, None, request, role_booleans,
        context_extra={'scoped': scoped},
    )
