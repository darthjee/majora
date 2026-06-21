"""Views for authentication endpoints (login, register, logout)."""

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


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
    return Response({'logged_in': True, 'username': user.username})
