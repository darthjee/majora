"""Private helpers shared across password-reset view modules."""

import secrets

from accounts.models import PasswordResetToken
from accounts.url_builder import FrontendBaseUrl
from accounts.views.auth._shared import _send_email
from games.settings import Settings

INVALID_OR_EXPIRED_TOKEN_ERROR = {'error': 'Invalid or expired token'}


def build_recovery_url(token):
    """Build the frontend URL the user follows to set a new password."""
    return f'{FrontendBaseUrl().build()}/#/recover-password?token={token}'


def send_password_reset_email(user, token):
    """Send a password recovery email containing the reset link to the user."""
    context = {
        'recovery_url': build_recovery_url(token),
        'expiration_minutes': Settings.password_reset_token_expiration_minutes(),
    }
    _send_email(user, 'accounts/password_reset_email.txt', 'Majora password reset', context)


def _create_and_send_reset_token(user):
    """Create a password reset token for the user and email it to them."""
    token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(user=user, token=token)
    send_password_reset_email(user, token)


def get_or_create_recovery_token(user):
    """Return a valid existing token's value for `user`, or create and return a new one."""
    existing = PasswordResetToken.objects.filter(user=user).order_by('-created_at').first()
    if existing is not None and existing.is_valid():
        return existing.token

    token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(user=user, token=token)
    return token
