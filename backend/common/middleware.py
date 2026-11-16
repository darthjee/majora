"""Middleware that marks and optionally rejects requests that bypass the Tent proxy."""

from django.http import JsonResponse

from common.cache_control import forbid_storing
from common.proxy_trust import enforce_enabled, is_via_proxy, proxy_secret

ENFORCEMENT_EXEMPT_PATHS = frozenset({'/ready.json'})


class ProxyTrustMiddleware:
    """Set `request.via_proxy` and neutralize forwarded headers on untrusted requests.

    - A request is trusted when `PROXY_SECRET` is empty or `X-Proxy-Secret` matches it.
    - An untrusted request loses `X-Forwarded-Host`, so `request.get_host()` returns the real
      `Host` header, and statistics skip it.
    - With `PROXY_ENFORCE=true` and a non-empty `PROXY_SECRET`, untrusted requests get a 403,
      except the exact path `/ready.json` (platform health check). Nothing is logged per request.

    `via_proxy` is never used to grant or deny access to a resource, only for the 403 above.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.via_proxy = is_via_proxy(request)
        if not request.via_proxy:
            request.META.pop('HTTP_X_FORWARDED_HOST', None)
            if self._must_reject(request):
                return self._forbidden()
        return self.get_response(request)

    def _must_reject(self, request):
        """Return whether the untrusted `request` must be answered with a 403."""
        return (
            enforce_enabled()
            and bool(proxy_secret())
            and request.path_info not in ENFORCEMENT_EXEMPT_PATHS
        )

    def _forbidden(self):
        """Return the uncacheable 403 response."""
        return forbid_storing(JsonResponse({'detail': 'Forbidden'}, status=403))
