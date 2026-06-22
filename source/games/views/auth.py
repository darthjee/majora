"""Views for authentication endpoints (login, register, logout)."""

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.template.loader import render_to_string
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from games.models import UserProfile
from games.settings import Settings

REGISTER_REQUIRED_FIELDS = {'name', 'email', 'password', 'password_confirmation'}


def send_test_email(user):
    """Send a test email to the given user's address."""
    if not Settings.emails_enabled():
        return

    message = render_to_string('games/test_email.txt', {'username': user.username})
    send_mail(
        subject='Majora test email',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def send_welcome_email(user):
    """Send a welcome email to the given user's address."""
    if not Settings.emails_enabled():
        return

    message = render_to_string('games/welcome_email.txt', {'username': user.username})
    send_mail(
        subject='Welcome to Majora',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def _validate_register_payload(data):
    """Validate the registration payload, returning an error message or None."""
    if set(data.keys()) != REGISTER_REQUIRED_FIELDS:
        return 'unexpected or missing fields'

    if any(not data.get(field) for field in REGISTER_REQUIRED_FIELDS):
        return 'name, email, password and password_confirmation are required'

    try:
        validate_email(data.get('email'))
    except ValidationError:
        return 'invalid email'

    if data.get('password') != data.get('password_confirmation'):
        return 'password and password_confirmation must match'

    if User.objects.filter(username=data.get('name')).exists():
        return 'name already exists'

    if User.objects.filter(email=data.get('email')).exists():
        return 'email already exists'

    return None


def _create_registered_user(data):
    """Create a new user and auth token from a validated registration payload."""
    user = User.objects.create_user(
        username=data.get('name'),
        email=data.get('email'),
        password=data.get('password'),
    )
    token, _ = Token.objects.get_or_create(user=user)
    return user, token


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
    return Response({'token': token.key})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Create a new user account, returning an auth token for auto-login."""
    error = _validate_register_payload(request.data)
    if error is not None:
        return Response({'error': error}, status=400)

    user, token = _create_registered_user(request.data)
    send_welcome_email(user)

    return Response({'username': user.username, 'token': token.key}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Revoke the requesting user's authentication token."""
    Token.objects.filter(user=request.user).delete()
    return Response(status=204)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status(request):
    """Report whether the requesting token (if any) is logged in."""
    auth = TokenAuthentication()
    try:
        result = auth.authenticate(request)
    except Exception:
        result = None

    if result is None:
        return Response({'logged_in': False})

    user, _ = result
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return Response({
        'logged_in': True,
        'username': user.username,
        'settings': {'favorite_language': profile.favorite_language},
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def language(request):
    """Persist the requesting user's favorite language preference."""
    value = request.data.get('language', '')
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.favorite_language = value
    profile.save()
    return Response({'favorite_language': profile.favorite_language})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email(request):
    """Send a test email to the requesting user's own address."""
    if not request.user.email:
        return Response({'error': 'User has no email address configured'}, status=400)

    send_test_email(request.user)
    return Response({'sent': True})
