"""View for sending a test email to the requesting user."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ._shared import send_test_email


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email(request):
    """Send a test email to the requesting user's own address."""
    if not request.user.email:
        return Response({'error': 'User has no email address configured'}, status=400)

    send_test_email(request.user)
    return Response({'sent': True})
