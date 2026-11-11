"""Custom middleware for the games app."""

from common.cache_control import forbid_storing
from games.settings import Settings


class CacheControlMiddleware:
    """Add a Cache-Control header to every JSON response.

    - Skips responses that already carry ``X-Skip-Cache: true`` (these are
      typically authenticated write endpoints whose proxy caching is already
      suppressed).
    - Requests under the ``/permissions/`` path prefix always get the anonymous cache tier,
      regardless of the real requester's own auth state: every endpoint there is
      a role-simulated ``permissions.json`` response, identity-independent by construction
      even when the actual caller happens to be logged in.
    - Anonymous tier, successful (2xx) → ``public, max-age=<anon_seconds>``, or
      ``private, max-age=<anon_seconds>`` when the response sets (or deletes) a cookie: a
      response carrying ``Set-Cookie`` is never ``public``.
    - Anonymous tier, any other status → ``no-store``
    - Authenticated requests → ``private, max-age=<auth_seconds>``

    A request stopped by an earlier middleware before ``request.user`` was set is anonymous.
    This middleware must be listed in ``MIDDLEWARE`` above every middleware that sets a
    cookie, so that it sees those cookies on the response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Authorization/status endpoints opt out of caching via X-Skip-Cache: true.
        # Respond with no-store so no client or proxy caches the result (a view's own
        # `private, no-store` is kept).
        if response.get('X-Skip-Cache') == 'true':
            return forbid_storing(response)

        # Every /permissions/ endpoint is identity-independent, role-simulated data, so it
        # always gets the public/anonymous cache tier regardless of the real requester's own
        # auth state.
        if request.path.startswith('/permissions/'):
            return self._apply_public_cache_control(response)

        if self._is_authenticated(request):
            return self._apply_authenticated_cache_control(response)
        return self._apply_public_cache_control(response)

    def _is_authenticated(self, request):
        """Return whether `request` resolved to an authenticated user."""
        user = getattr(request, 'user', None)
        return user is not None and user.is_authenticated

    def _apply_authenticated_cache_control(self, response):
        """Set the private, authenticated-tier Cache-Control header on `response`."""
        max_age = Settings.cache_control_authenticated_max_age()
        response['Cache-Control'] = f'private, max-age={max_age}'
        return response

    def _apply_public_cache_control(self, response):
        """Set the anonymous-tier Cache-Control header on `response`: `no-store` on failure."""
        if 200 <= response.status_code < 300:
            max_age = Settings.cache_control_anonymous_max_age()
            response['Cache-Control'] = f'{self._visibility(response)}, max-age={max_age}'
        else:
            response['Cache-Control'] = 'no-store'
        return response

    def _visibility(self, response):
        """Return `private` when `response` sets (or deletes) a cookie, else `public`."""
        return 'private' if response.cookies else 'public'
