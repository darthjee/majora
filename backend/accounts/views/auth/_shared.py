"""Private helpers shared across authentication view modules."""

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.template.loader import render_to_string
from rest_framework.authtoken.models import Token

from accounts.account_uniqueness import display_name_taken, email_taken, username_taken
from accounts.models import UserProfile
from games.settings import Settings

REGISTER_REQUIRED_FIELDS = {'name', 'display_name', 'email', 'password', 'password_confirmation'}


def _send_email(user, template, subject, context=None):
    """Render `template` with `context` and email it to `user`, when emails are enabled."""
    if not Settings.emails_enabled():
        return

    message = render_to_string(template, context or {})
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def send_test_email(user):
    """Send a test email to the given user's address."""
    _send_email(
        user, 'accounts/test_email.txt', 'Majora test email', {'username': user.username},
    )


def send_welcome_email(user):
    """Send a welcome email to the given user's address."""
    _send_email(
        user, 'accounts/welcome_email.txt', 'Welcome to Majora', {'username': user.username},
    )


def _validate_register_payload(data):
    """Validate the registration payload, returning the first error message, or None."""
    validators = (
        _validate_required_fields,
        _validate_email_format,
        _validate_passwords_match,
        _validate_unique_name,
        _validate_unique_display_name,
        _validate_unique_email,
    )
    for validator in validators:
        error = validator(data)
        if error:
            return error
    return None


def _validate_required_fields(data):
    """Return an error message if required fields are missing or empty, else None."""
    if set(data.keys()) != REGISTER_REQUIRED_FIELDS:
        return 'unexpected or missing fields'
    if any(not data.get(field) for field in REGISTER_REQUIRED_FIELDS):
        return 'name, display_name, email, password and password_confirmation are required'
    return None


def _validate_email_format(data):
    """Return an error message if the email is not a valid address, else None."""
    try:
        validate_email(data.get('email'))
    except ValidationError:
        return 'invalid email'
    return None


def _validate_passwords_match(data):
    """Return an error message if password and password_confirmation differ, else None."""
    if data.get('password') != data.get('password_confirmation'):
        return 'password and password_confirmation must match'
    return None


def _validate_unique_name(data):
    """Return an error message if the given name is already registered, else None."""
    if username_taken(data.get('name')):
        return 'name already exists'
    return None


def _validate_unique_display_name(data):
    """Return an error message if the given display_name is already registered, else None."""
    if display_name_taken(data.get('display_name')):
        return 'display name already exists'
    return None


def _validate_unique_email(data):
    """Return an error message if the given email is already registered, else None."""
    if email_taken(data.get('email')):
        return 'email already exists'
    return None


def _create_registered_user(data):
    """Create a new user, profile, and auth token from a validated registration payload."""
    user = User.objects.create_user(
        username=data.get('name'),
        email=data.get('email'),
        password=data.get('password'),
    )
    UserProfile.objects.create(user=user, display_name=data.get('display_name'))
    token, _ = Token.objects.get_or_create(user=user)
    return user, token


def _authenticate_from_session(request):
    """Try to authenticate from a session-stored token key.

    Returns a (result, session_auth) tuple where result is (user, token) or None,
    and session_auth is True when authentication succeeded via the session.
    """
    session_token_key = request.session.get('auth_token')
    if not session_token_key:
        return None, False
    try:
        token_obj = Token.objects.select_related('user').get(key=session_token_key)
        return (token_obj.user, token_obj), True
    except Token.DoesNotExist:
        request.session.flush()
        return None, False
