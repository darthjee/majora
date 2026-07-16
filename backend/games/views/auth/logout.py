"""View for the logout endpoint."""

from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from statistics import cookies


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Revoke the requesting user's authentication token, flush the session, clear statistics."""
    Token.objects.filter(user=request.user).delete()
    request.session.flush()
    response = Response(status=204)
    response.delete_cookie(cookies.COOKIE_NAME)
    return response
