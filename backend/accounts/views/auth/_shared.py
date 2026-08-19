"""Private helpers shared across authentication view modules."""

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.template.loader import render_to_string
from rest_framework.authtoken.models import Token

from accounts.account_uniqueness import display_name_taken, email_taken, username_taken
from accounts.authentication import CookieTokenAuthentication
from accounts.models import CacheToken, UserProfile
from games.settings import Settings
from statistics.session_attachment import attach_user

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


def _normalize_register_payload(data):
    """Return a copy of `data` with string `name`/`email` values lowercased.

    Every other key/value (including unexpected extra keys) is copied as-is, so
    `_validate_required_fields`'s exact-keys check still behaves correctly. Non-string
    `name`/`email` values are left untouched, so the existing validators still reject
    malformed payloads the same way they do today.
    """
    normalized = dict(data)
    for field in ('name', 'email'):
        value = normalized.get(field)
        if isinstance(value, str):
            normalized[field] = value.lower()
    return normalized


def _validate_register_payload(data):
    """Validate the registration payload, returning the first error message, or None."""
    validators = (
        _validate_required_fields,
        _validate_email_format,
        _validate_passwords_match,
        _validate_username_format,
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


def _validate_username_format(data):
    """Return an error message if the username contains '@', else None."""
    if '@' in data.get('name', ''):
        return 'username cannot contain @'
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


def resolve_status_payload(request):
    """Resolve the full login-status payload for `request`.

    Tries token authentication then session authentication, honoring the resolved user's
    `UserProfile.status` (pending/denied/approved) gate. Shared by `status.py`'s
    `/users/status.json` and `header_status.py`'s `/users/header_status.json`, so both
    endpoints derive from the same single source of truth for status resolution and
    `CacheToken` minting.
    """
    result, session_auth = _resolve_status_authentication(request)

    if result is None:
        return {'logged_in': False}

    user, token_obj = result
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return _build_status_payload(user, profile, token_obj, session_auth)


def _resolve_status_authentication(request):
    """Return a (result, session_auth) tuple, trying token then session authentication."""
    result = CookieTokenAuthentication().authenticate_via_header(request)

    if result is not None:
        return result, False

    return _authenticate_from_session(request)


def _build_status_payload(user, profile, token_obj, session_auth):
    """Build the status payload for `user`, honoring their profile's approval status.

    A `pending` user still resolves a valid token/session, but gets a dedicated
    `{'logged_in': False, 'status': 'pending'}` payload instead of the full logged-in one,
    so the frontend can show an "awaiting approval" screen. `denied` users fall back to a
    plain `{'logged_in': False}`.
    """
    if profile.status == UserProfile.STATUS_PENDING:
        return {'logged_in': False, 'status': 'pending'}

    if profile.status != UserProfile.STATUS_APPROVED:
        return {'logged_in': False}

    return _build_logged_in_status_payload(user, profile, token_obj, session_auth)


def _build_logged_in_status_payload(user, profile, token_obj, session_auth):
    """Build the full logged-in payload for an `approved` `user`.

    `cache_token` is (re)minted unconditionally, unlike `token` (which is only ever
    returned for `session_auth`), since a cache token needs to be established on every
    bootstrap call regardless of which authentication path resolved the user.
    """
    cache_token, _ = CacheToken.objects.get_or_create(user=user)
    payload = {
        'logged_in': True,
        'username': user.username,
        'user_id': user.id,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'settings': {'favorite_language': profile.favorite_language},
        'cache_token': cache_token.key,
    }
    if session_auth:
        payload['token'] = token_obj.key
    return payload


def skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response


def attach_statistics_session(request, user):
    """Tie the request's statistics session to `user`, rotating it if already tied to one.

    Shared by `accounts.views.auth.login` and `accounts.views.authorization_requests.poll`
    (the latter issuing real login credentials once an authorization request is approved),
    so both credential-issuing paths behave identically afterwards.
    """
    session = request.statistics_session
    if session is None:
        return
    new_session = attach_user(session, user)
    if new_session is not session:
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
