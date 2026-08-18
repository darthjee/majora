"""View for the entity-agnostic game document permissions-check endpoint (issue #1099)."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...serializers import GameDocumentPermissionsSerializer
from ..common import parse_role_booleans, permissions_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_document_permissions(request):
    """Return whether the requester (real or role-simulated) may edit a game document."""
    role_booleans = parse_role_booleans(request)
    return permissions_response(GameDocumentPermissionsSerializer, None, request, role_booleans)
