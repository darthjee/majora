"""Shared `Cache-Control` helpers for the response middlewares."""

NO_STORE = 'no-store'


def forbid_storing(response):
    """Set `Cache-Control: no-store` on `response`, keeping a stricter value already set.

    A view may set its own `no-store` value (e.g. `private, no-store`); it is kept as is so
    the middlewares never weaken or drop its `private` directive.
    """
    if NO_STORE not in _directives(response):
        response['Cache-Control'] = NO_STORE
    return response


def _directives(response):
    """Return the lower-cased directives of `response`'s `Cache-Control` header."""
    value = response.get('Cache-Control', '')
    return {directive.strip().lower() for directive in value.split(',')}
