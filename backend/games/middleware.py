"""Custom middleware for the games app."""

from games.settings import Settings


class CacheControlMiddleware:
    """Add a Cache-Control header to every JSON response.

    - Skips responses that already carry ``X-Skip-Cache: true`` (these are
      typically authenticated write endpoints whose proxy caching is already
      suppressed).
    - Requests under the ``/permissions/`` path prefix always get the public/anonymous
      cache tier, regardless of the real requester's own auth state: every endpoint there is
      a role-simulated ``permissions.json`` response, identity-independent by construction
      even when the actual caller happens to be logged in.
    - Unauthenticated requests → ``public, max-age=<anon_seconds>``
    - Authenticated requests    → ``private, max-age=<auth_seconds>``
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Authorization/status endpoints opt out of caching via X-Skip-Cache: true.
        # Respond with no-store so no client or proxy caches the result.
        if response.get('X-Skip-Cache') == 'true':
            response['Cache-Control'] = 'no-store'
            return response

        # Every /permissions/ endpoint is identity-independent, role-simulated data, so it
        # always gets the public/anonymous cache tier regardless of the real requester's own
        # auth state.
        if request.path.startswith('/permissions/'):
            return self._apply_public_cache_control(response)

        if request.user.is_authenticated:
            return self._apply_authenticated_cache_control(response)
        return self._apply_public_cache_control(response)

    def _apply_authenticated_cache_control(self, response):
        """Set the private, authenticated-tier Cache-Control header on `response`."""
        max_age = Settings.cache_control_authenticated_max_age()
        response['Cache-Control'] = f'private, max-age={max_age}'
        return response

    def _apply_public_cache_control(self, response):
        """Set the public, anonymous-tier Cache-Control header on `response`, if successful."""
        if 200 <= response.status_code < 300:
            max_age = Settings.cache_control_anonymous_max_age()
            response['Cache-Control'] = f'public, max-age={max_age}'
        else:
            response['Cache-Control'] = 'no-store'
        return response
