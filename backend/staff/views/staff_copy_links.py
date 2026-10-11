"""View listing the pending and failed hard links of a copy target game."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..copy_link_query import CopyLinkEntities, PendingCopyLinks
from ..serializers import StaffCopyLinkSerializer
from ._staff_copy_shared import resolve_game_param


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_copy_links(request):
    """Return the `to` game's not-yet-linked copy uploads, unpaginated, without paths/tokens."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    to_game, error_response = resolve_game_param(request.query_params, 'to')
    if error_response:
        return error_response

    uploads = PendingCopyLinks(to_game).uploads()
    context = {'entities': CopyLinkEntities(uploads).load()}
    return Response(StaffCopyLinkSerializer(uploads, many=True, context=context).data)
