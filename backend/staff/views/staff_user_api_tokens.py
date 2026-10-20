"""View listing a user's scoped API tokens, restricted to staff/superuser sessions."""

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.serializers import ApiTokenItemSerializer
from games.decorators import restricted

from ._api_token_shared import staff_session_error


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_session and
# require_staff so scoped-token, unauthenticated or non-staff callers get a proper 401/403.
@permission_classes([AllowAny])
def staff_user_api_tokens(request, user_id):
    """Return every scoped API token of the given user (metadata only), newest first."""
    error_response = staff_session_error(request)
    if error_response:
        return error_response

    user = get_object_or_404(User, pk=user_id)
    tokens = user.api_tokens.prefetch_related('games').order_by('-created_at', '-pk')
    return Response(ApiTokenItemSerializer(tokens, many=True).data)
