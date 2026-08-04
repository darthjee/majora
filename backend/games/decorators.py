"""View-level decorators declaring a /games/ endpoint's cache tier."""

from functools import wraps


def restricted(view_func):
    """Mark `view_func` as restricted: every response it returns skips proxy caching.

    Sets `X-Skip-Cache: true` on the response unconditionally, regardless of which
    branch inside `view_func` produced it (success, validation error, permission
    denial, ...). Must decorate the already-`@api_view`-wrapped view (i.e. be the
    outermost decorator), since it needs to see the final response DRF builds.
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        """Call `view_func`, then unconditionally set `X-Skip-Cache: true` on its response."""
        response = view_func(request, *args, **kwargs)
        response['X-Skip-Cache'] = 'true'
        return response

    return wrapper


def regular(view_func):
    """Mark `view_func` as regular/cacheable.

    A no-op today — `CacheControlMiddleware` already applies the right `Cache-Control`
    tier to any response without `X-Skip-Cache: true`. Exists as the explicit
    counterpart to `@restricted` so every view ends up annotated with one or the
    other, and as a hook for future regular-endpoint-specific behavior.
    """
    return view_func
