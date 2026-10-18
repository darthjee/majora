"""View-level decorators declaring a /games/ endpoint's cache tier and token scopes."""

from functools import wraps
from types import MappingProxyType

from accounts.scopes import METHOD_ACTIONS, SCOPES

TOKEN_SCOPES_ATTR = 'token_scopes'


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


def token_scopes(**methods):
    """Declare the scopes a scoped API token needs, per HTTP method, to call the view.

    Usage: `@token_scopes(GET=[], POST=['documents:write'])`. Each value lists every scope
    required (all of them); an empty list declares a public read that needs no scope. A
    method with no entry rejects scoped tokens (fail closed).

    Convention: `@token_scopes` must be applied to the `@api_view`-wrapped view, i.e. sit
    above `@api_view`. It may be stacked in any order with `@restricted`, `@skip_cache` and
    `@regular`; `get_token_scopes` follows the `__wrapped__` chain to find it. Applying it
    below `@api_view` raises `ValueError`, because DRF would hide the declaration.

    Raises `ValueError` at decoration (import) time for an unknown method, an unknown scope,
    a method the view does not serve, or a non-DRF view.
    """
    declaration = _ScopeDeclaration(methods).build()

    def decorator(view_func):
        """Attach the validated declaration to `view_func` and return it."""
        _ensure_serves(view_func, declaration)
        setattr(view_func, TOKEN_SCOPES_ATTR, declaration)
        return view_func

    return decorator


def get_token_scopes(func):
    """Return the `@token_scopes` declaration of the view `func`, or None when undeclared."""
    while func is not None:
        declaration = getattr(func, TOKEN_SCOPES_ATTR, None)
        if declaration is not None:
            return declaration
        func = getattr(func, '__wrapped__', None)
    return None


def _ensure_serves(view_func, declaration):
    """Raise `ValueError` unless `view_func` is a DRF view serving every declared method."""
    view_class = getattr(view_func, 'cls', None)
    if view_class is None:
        raise ValueError('@token_scopes must decorate an @api_view-wrapped view (place it above)')
    missing = [method for method in declaration if not hasattr(view_class, method.lower())]
    if missing:
        raise ValueError(f'@token_scopes declares methods the view does not serve: {missing}')


class _ScopeDeclaration:
    """Validate and freeze the keyword arguments given to `@token_scopes`."""

    def __init__(self, methods):
        """Keep the raw `{method: scopes}` mapping."""
        self.methods = methods

    def build(self):
        """Return a read-only `{method: tuple_of_scopes}` mapping, or raise `ValueError`."""
        if not self.methods:
            raise ValueError('@token_scopes needs at least one method')
        return MappingProxyType(
            {method: self._scopes_for(method, scopes) for method, scopes in self.methods.items()}
        )

    def _scopes_for(self, method, scopes):
        """Return `scopes` as a tuple after checking the method and every scope."""
        if method not in METHOD_ACTIONS:
            raise ValueError(f'@token_scopes: unknown HTTP method {method!r}')
        if isinstance(scopes, str):
            raise ValueError(f'@token_scopes: {method} must list scopes, not a string')
        unknown = [scope for scope in scopes if scope not in SCOPES]
        if unknown:
            raise ValueError(f'@token_scopes: unknown scopes {unknown} for {method}')
        return tuple(scopes)
