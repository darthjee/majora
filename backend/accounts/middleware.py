"""Custom middleware for the accounts app."""

from accounts.authentication import BEARER_PATTERN


class BearerNoCacheMiddleware:
    """Keep every response to a Bearer (scoped API token) request out of any cache.

    Responses to requests whose ``Authorization`` value matches ``BEARER_PATTERN`` get
    ``X-Skip-Cache: true`` and ``Cache-Control: no-store``, whatever their status. Every
    other response is left untouched. The ``X-Bearer-Request`` proxy marker is never read:
    Django is reachable directly, so only the ``Authorization`` header is trusted.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if self._is_bearer(request):
            response['X-Skip-Cache'] = 'true'
            response['Cache-Control'] = 'no-store'
        return response

    def _is_bearer(self, request):
        """Return whether `request` carries a Bearer `Authorization` header."""
        return bool(BEARER_PATTERN.search(request.META.get('HTTP_AUTHORIZATION', '')))
