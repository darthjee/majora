"""View-level decorators declaring a /games/ endpoint's cache tier."""

from functools import wraps


def _skip_cache_wrapper(view_func):
    """Return a wrapper around `view_func` that unconditionally sets `X-Skip-Cache: true`.

    Shared body for `@restricted` and `@skip_cache` — the two decorators mean different
    things (permission tier vs. cache-worthiness), but produce the exact same response
    mutation, so they share this implementation rather than duplicating it.
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        """Call `view_func`, then unconditionally set `X-Skip-Cache: true` on its response."""
        response = view_func(request, *args, **kwargs)
        response['X-Skip-Cache'] = 'true'
        return response

    return wrapper


def restricted(view_func):
    """Mark `view_func` as restricted: every response it returns skips proxy caching.

    Sets `X-Skip-Cache: true` on the response unconditionally, regardless of which
    branch inside `view_func` produced it (success, validation error, permission
    denial, ...). Must decorate the already-`@api_view`-wrapped view (i.e. be the
    outermost decorator), since it needs to see the final response DRF builds.

    Use on endpoints whose permission tier is itself restricted (dm/admin/owner-only) —
    for a permission-`@regular` endpoint that still isn't worth caching, use `@skip_cache`
    instead, which carries no permission connotation.
    """
    return _skip_cache_wrapper(view_func)


def skip_cache(view_func):
    """Mark `view_func` as not worth proxy-caching, independent of its permission tier.

    Same unconditional `X-Skip-Cache: true` behavior as `@restricted` (see
    `_skip_cache_wrapper`), but usable stacked with `@regular` on endpoints that are open
    to everyone yet whose responses are too per-request-specific (e.g. high-cardinality,
    rarely-reused) to be worth caching. Must be the outermost decorator, same as
    `@restricted`.
    """
    return _skip_cache_wrapper(view_func)


def regular(view_func):
    """Mark `view_func` as regular/cacheable.

    A no-op today — `CacheControlMiddleware` already applies the right `Cache-Control`
    tier to any response without `X-Skip-Cache: true`. Exists as the explicit
    counterpart to `@restricted` so every view ends up annotated with one or the
    other, and as a hook for future regular-endpoint-specific behavior.
    """
    return view_func
