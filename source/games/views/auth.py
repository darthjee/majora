"""Views for authentication endpoints (login, register, logout)."""

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.template.loader import render_to_string
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from games.models import UserProfile


def send_test_email(user):
    """Send a test email to the given user's address."""
    message = render_to_string('games/test_email.txt', {'username': user.username})
    send_mail(
        subject='Majora test email',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


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
    """Create a new user account."""
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')

    if not username or not password:
        return Response({'error': 'username and password are required'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'username already exists'}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'username': user.username}, status=201)


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
