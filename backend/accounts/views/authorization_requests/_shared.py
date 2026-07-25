"""Private helpers shared across authorization-request view modules."""

from rest_framework.response import Response

from accounts.models import AuthorizationRequest

NOT_FOUND_ERROR = {'error': 'not_found'}
NOT_OPEN_ERROR = {'error': 'not_open'}
EXPIRED_ERROR = {'error': 'expired'}
INVALID_CREDENTIALS_ERROR = {'error': 'invalid_credentials'}

_EXPIRABLE_STATUSES = (AuthorizationRequest.STATUS_OPEN, AuthorizationRequest.STATUS_APPROVED)


def client_ip(request):
    """Return the requester's IP, read only from `REMOTE_ADDR`.

    Deliberately does not honor `X-Forwarded-For`, unlike
    `statistics.middleware.StatisticsSessionMiddleware` (which prefers it for analytics,
    an accepted risk there): this IP is shown to a human as a trust signal when
    approving/denying a login request, so a client-spoofable header would undermine that
    signal. `REMOTE_ADDR` is set by the actual TCP connection and cannot be forged by the
    client, at the cost of being less accurate (e.g. reporting a reverse proxy's own IP)
    when this app sits behind a proxy without trusted-proxy-count validation configured.
    """
    return request.META.get('REMOTE_ADDR')


def get_authorization_request(uuid_value):
    """Return the `AuthorizationRequest` matching `uuid_value`, or `None`."""
    return AuthorizationRequest.objects.filter(uuid=uuid_value).first()


def expire_if_lazily_expired(authorization_request):
    """Persist `expired` if `authorization_request` is lazily past due; return whether it did.

    Only `open`/`approved` requests can lazily expire; `denied`/`expired`/`logged` are
    already terminal and are left untouched.
    """
    if authorization_request.status not in _EXPIRABLE_STATUSES:
        return False
    if not authorization_request.is_expired():
        return False
    authorization_request.mark_expired()
    return True


def lookup_owned_or_error(request, uuid_value):
    """Return `(authorization_request, None)` when owned by the caller, else `(None, 403)`."""
    authorization_request = get_authorization_request(uuid_value)
    if authorization_request is None or authorization_request.user_id != request.user.id:
        return None, skip_cache(Response(NOT_FOUND_ERROR, status=403))
    return authorization_request, None


def skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
