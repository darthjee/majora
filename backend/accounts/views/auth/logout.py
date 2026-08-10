"""View for the logout endpoint."""

from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import CacheToken
from statistics import cookies


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Revoke the requesting user's authentication and cache tokens, flush the session."""
    Token.objects.filter(user=request.user).delete()
    CacheToken.objects.filter(user=request.user).delete()
    request.session.flush()
    response = Response(status=204)
    response.delete_cookie(cookies.COOKIE_NAME)
    return response
