"""View for sending a test email to the requesting user."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.views.common import require_staff

from ._shared import send_test_email


@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def test_email(request):
    """Send a test email to the requesting user's own address, staff/superuser only."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    if not request.user.email:
        return Response({'error': 'User has no email address configured'}, status=400)

    send_test_email(request.user)
    return Response({'sent': True})
