"""Views for the password recovery flow (recover, reset-password)."""

import secrets

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.template.loader import render_to_string
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.models import PasswordResetToken
from games.settings import Settings

INVALID_OR_EXPIRED_TOKEN_ERROR = {'error': 'Invalid or expired token'}


def _build_recovery_url(token):
    """Build the frontend URL the user follows to set a new password."""
    return f'{settings.FRONTEND_BASE_URL}/#/recover-password?token={token}'


def send_password_reset_email(user, token):
    """Send a password recovery email containing the reset link to the user."""
    message = render_to_string(
        'games/password_reset_email.txt',
        {
            'recovery_url': _build_recovery_url(token),
            'expiration_minutes': Settings.password_reset_token_expiration_minutes(),
        },
    )
    send_mail(
        subject='Majora password reset',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def _create_and_send_reset_token(user):
    """Create a password reset token for the user and email it to them."""
    token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(user=user, token=token)
    send_password_reset_email(user, token)


@api_view(['POST'])
@permission_classes([AllowAny])
def recover(request):
    """Send a password recovery email if the given address matches a user."""
    email = request.data.get('email', '')
    user = User.objects.filter(email=email).first()

    if user is not None:
        _create_and_send_reset_token(user)

    return Response({'sent': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Set a new password using a valid, unexpired, unused recovery token."""
    token_value = request.data.get('token', '')
    password = request.data.get('password', '')

    reset_token = PasswordResetToken.objects.filter(token=token_value).first()
    if reset_token is None or not reset_token.is_valid():
        return Response(INVALID_OR_EXPIRED_TOKEN_ERROR, status=400)

    reset_token.consume(password)

    return Response({'reset': True})
