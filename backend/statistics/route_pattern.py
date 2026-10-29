"""Helper returning the stored route pattern of a request, never its raw path."""

from django.urls import Resolver404, resolve

UNRESOLVED = 'unresolved'
MAX_LENGTH = 255


def route_pattern(request):
    """Return the URL route pattern matched by `request`, or `UNRESOLVED` when none matches.

    The pattern (e.g. `games/<slug:game_slug>.json`) never carries URL parameters, tokens or
    the query string. Matching is in-memory (no database query). Truncated to `MAX_LENGTH`.
    """
    try:
        route = resolve(request.path_info).route
    except Resolver404:
        return UNRESOLVED
    return route[:MAX_LENGTH]
