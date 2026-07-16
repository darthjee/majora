"""View for the login endpoint."""

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from statistics.models import Session


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate a user and return an authentication token."""
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=401)

    token, _ = Token.objects.get_or_create(user=user)
    request.session['auth_token'] = token.key
    _attach_statistics_session(request, user)
    return Response({'token': token.key})


def _attach_statistics_session(request, user):
    """Tie the request's statistics session to `user`, rotating it if already tied to one."""
    session = request.statistics_session
    if session.user_id is None:
        session.user = user
        session.save(update_fields=['user'])
    else:
        new_session = Session.objects.create(ip=session.ip, user=user)
        _set_statistics_session(request, new_session)


def _set_statistics_session(request, session):
    """Rebind the request's statistics session, on both the DRF and Django request objects.

    DRF's `Request` proxies attribute *reads* it doesn't have to `request._request` (the
    underlying `HttpRequest`), but a plain attribute *write* only ever lands on whichever
    object it targets. `StatisticsSessionMiddleware` reads `request.statistics_session` off
    the raw `HttpRequest` after this view returns, so the write must reach it directly.
    """
    request.statistics_session = session
    request._request.statistics_session = session
