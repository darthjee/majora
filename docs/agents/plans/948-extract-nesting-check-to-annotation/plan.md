# Plan: Extract nesting check to annotation

Issue: [948-extract-nesting-check-to-annotation.md](../issues/948-extract-nesting-check-to-annotation.md)

## Overview

Introduce two decorators, `@restricted` and `@regular`, that declare a `/games/` view's
cache tier in one place instead of the ~50 hand-written `response['X-Skip-Cache'] = 'true'`
assignments scattered across `backend/games/views/`. `@restricted` unconditionally sets
`X-Skip-Cache: true` on every response the decorated view produces; `@regular` is a no-op
today, reserved for future behavior. This plan only builds the decorators and migrates the
`backend/games/views/staff/*` slice (chosen because every endpoint there sets the header
unconditionally today, so it's a pure mechanical swap with no behavior change) — the rest
of the games app migrates in follow-up issues.

## Context

Every `/games/` endpoint is a function-based DRF view decorated with `@api_view(...)` (plus
`@authentication_classes`/`@permission_classes`) — there are no class-based views with HTTP
methods in this app. `CacheControlMiddleware`
(`backend/games/middleware.py`) already reads `X-Skip-Cache: true` off the response and
converts it to `Cache-Control: no-store`; this plan doesn't touch the middleware, only how
the header gets set on the view side.

Today, restricted-endpoint views set the header by hand, often via a private `_skip_cache`
helper repeated per file, and apply it at every early-return point (validation errors,
permission failures, the success path) — e.g. `staff_user_approve.py` wraps three separate
`Response(...)` calls individually. A decorator that wraps the *entire* view function call
removes the need for any of that: whichever branch inside the view returns a `Response`,
the decorator sets the header on it once, right before returning to the caller.

## Implementation Steps

### Step 1 — Add the `restricted`/`regular` decorators

Create `backend/games/decorators.py`:

```python
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
```

**Decoration order matters**: `@restricted`/`@regular` must be the outermost decorator,
applied *above* `@api_view(...)`, so they wrap the fully-resolved Django view callable and
can mutate whatever `Response` DRF ultimately returns:

```python
@restricted
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def staff_users_list(request):
    ...
```

### Step 2 — Add tests for the decorators

Create `backend/games/tests/decorators_test.py` (mirrors `backend/games/decorators.py`,
same convention as the existing `backend/games/tests/middleware_test.py`). Cover, using
plain dummy view functions (no need for a real DRF/`api_view` view):

- `@restricted` sets `X-Skip-Cache: true` on a returned `Response`/`HttpResponse`.
- `@restricted` sets the header regardless of status code (e.g. a 400/403 error response),
  proving it isn't tied to any particular branch inside the view.
- `@restricted` preserves `*args`/`**kwargs` passthrough (e.g. a URL-captured `user_id`)
  and the wrapped function's identity (`functools.wraps` — `__name__`, `__doc__`).
- `@regular` returns the exact same callable it received (identity), so it has zero
  runtime overhead.

### Step 3 — Migrate `backend/games/views/staff/*` to `@restricted`

For each file below: add `from ...decorators import restricted` (adjust the relative
import depth to match the file's existing imports, e.g. `from ..decorators import
restricted` — `staff/` is one level under `views/`, which is one level under `games/`),
add `@restricted` as the outermost decorator on the view function, then delete every
now-redundant manual header assignment and any now-unused local `_skip_cache` helper:

- `backend/games/views/staff/staff_users_list.py` — remove the inline
  `response['X-Skip-Cache'] = 'true'` after `paginated_list_response(...)`, remove the
  `_skip_cache` helper, and unwrap its one call site inside `_filter_by_status`.
- `backend/games/views/staff/staff_user_approve.py` — remove the `_skip_cache` helper and
  unwrap its three call sites (`_parse_user_id`, `_require_pending`, and the success
  return).
- `backend/games/views/staff/staff_user_deny.py` — remove the `_skip_cache` helper and
  unwrap its two call sites (`_parse_user_id` and the success return).
- `backend/games/views/staff/staff_user_detail.py` — remove the `_skip_cache` helper and
  unwrap its two call sites (`_update_user` and the GET success return).
- `backend/games/views/staff/staff_user_recovery_link.py` — remove the inline
  `response['X-Skip-Cache'] = 'true'` line.
- `backend/games/views/staff/staff_cache_clear.py` — remove the `_skip_cache` helper and
  unwrap its one call site.
- `backend/games/views/staff/staff_cache_summary.py` — remove the inline
  `response['X-Skip-Cache'] = 'true'` line.

`backend/games/views/staff/__init__.py` needs no change — the re-exported names still
point to the same (now-decorated) callables.

No test changes are expected in `backend/games/tests/views/staff/*_test.py`: they assert
`response['X-Skip-Cache'] == 'true'` on both success and error responses today, and
`@restricted` preserves that on every branch. Run the suite to confirm behavior parity
rather than assuming it.

## Files to Change

- `backend/games/decorators.py` — new file, `restricted`/`regular` decorators.
- `backend/games/tests/decorators_test.py` — new file, decorator unit tests.
- `backend/games/views/staff/staff_users_list.py`
- `backend/games/views/staff/staff_user_approve.py`
- `backend/games/views/staff/staff_user_deny.py`
- `backend/games/views/staff/staff_user_detail.py`
- `backend/games/views/staff/staff_user_recovery_link.py`
- `backend/games/views/staff/staff_cache_clear.py`
- `backend/games/views/staff/staff_cache_summary.py`

## CI Checks

- `backend/`: `cd backend && poetry run pytest --cov` and `poetry run ruff check .`
  (CI jobs: `pytest_all` covers `games/tests/decorators_test.py`; `pytest_views_rest`
  covers `games/tests/views/staff/*`; `checks` runs `ruff check .`)

## Notes

- The `cache` agent's read-only review duty ("restricted endpoints set the `X-Skip-Cache`
  header") is unaffected: no endpoints are added, removed, or renamed, and every migrated
  endpoint still emits the header — just via the decorator instead of by hand. No
  `navi/navi_config.yaml` changes are needed.
- This plan intentionally leaves the conditional-to-unconditional endpoints
  (`_character_shared.py`, `_detail.py`, `_treasures.py`, `_photos.py`, etc.) untouched —
  migrating them changes actual caching behavior (they'd become always-restricted) and
  belongs in its own follow-up issue for focused review, per the issue's decision.
