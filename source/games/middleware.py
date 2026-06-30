"""Custom middleware for the games app."""

from games.settings import Settings


class CacheControlMiddleware:
    """Add a Cache-Control header to every JSON response.

    - Skips responses that already carry ``X-Skip-Cache: true`` (these are
      typically authenticated write endpoints whose proxy caching is already
      suppressed).
    - Skips the health check endpoint (``/health.json``).
    - Unauthenticated requests → ``public, max-age=<anon_seconds>``
    - Authenticated requests    → ``private, max-age=<auth_seconds>``
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Do not add Cache-Control when the view already asked to skip caching.
        if response.get('X-Skip-Cache') == 'true':
            return response

        # Do not add Cache-Control to the health check endpoint.
        if request.path.endswith('/health.json'):
            return response

        if request.user.is_authenticated:
            max_age = Settings.cache_control_authenticated_max_age()
            response['Cache-Control'] = f'private, max-age={max_age}'
        elif 200 <= response.status_code < 300:
            max_age = Settings.cache_control_anonymous_max_age()
            response['Cache-Control'] = f'public, max-age={max_age}'
        else:
            response['Cache-Control'] = 'no-store'

        return response
