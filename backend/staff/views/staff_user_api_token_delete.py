"""View revoking (deleting) a user's scoped API token, restricted to staff/superuser sessions."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import ApiToken
from games.decorators import restricted

from ._api_token_shared import log_api_token_action, staff_session_error


@restricted
@api_view(['DELETE'])
@parser_classes([JSONParser])
# AllowAny: authentication/authorisation is enforced inline via require_session and
# require_staff so scoped-token, unauthenticated or non-staff callers get a proper 401/403.
@permission_classes([AllowAny])
def staff_user_api_token_delete(request, user_id, token_id):
    """Delete the token row, 404 when it does not belong to `user_id`."""
    error_response = staff_session_error(request)
    if error_response:
        return error_response

    api_token = get_object_or_404(ApiToken, pk=token_id, owner_id=user_id)
    log_api_token_action('delete', api_token.pk, user_id, request.user.id)
    api_token.delete()
    return Response(status=204)
