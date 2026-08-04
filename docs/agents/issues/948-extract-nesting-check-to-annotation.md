# Issue: Extract nesting check to annotation

## Description
We have, for endpoints under `/games/`, some endpoints that are regular and some that
are restricted. Even though two regular endpoints share the same access permissions
(and likewise for restricted ones), they all share the same idea of cache: regular
endpoints are cacheable, restricted endpoints are not — enforced today by manually
setting the `X-Skip-Cache: true` response header. This behavior is duplicated by hand
across roughly 50 view files under `backend/games/views/`, with no single shared
mechanism to declare an endpoint's cache tier.

## Problem
- The `X-Skip-Cache` header is set by hand in dozens of view helper functions, so there
  is no single place that defines "this endpoint is restricted."
- The duplication is also inconsistent: some views set the header unconditionally (e.g.
  `staff/*`), while others only set it conditionally, depending on response content —
  e.g. `_character_shared.py`, `_detail.py`, `_treasures.py`, `_photos.py` currently
  skip cache only when a character happens to be hidden or a permission-gated 404
  applies. That means the same endpoint can be cached on one request and not on
  another, even though it's capable of returning restricted data — a caching-
  correctness bug, not just duplication.

## Solution
- The annotation is a **Python decorator applied to the DRF view function**. Every
  `/games/` endpoint today is a function-based view decorated with `@api_view(...)`
  (plus `@authentication_classes`/`@permission_classes`) — there are no class-based
  views with HTTP methods in this app — so `@restricted`/`@regular` stack alongside
  those existing decorators on the view function itself, not on a class method.
- The decision is **binary at the endpoint (view function) level**: if a view is
  decorated as restricted, every response it produces gets `X-Skip-Cache: true`
  unconditionally — the decorator itself sets the header, callers no longer set it by
  hand.
- This corrects the current inconsistency in the codebase, where several view helpers
  only set `X-Skip-Cache` **conditionally**, depending on the response content (e.g.
  `_character_shared.py`, `_detail.py`, `_treasures.py`, `_photos.py` currently skip
  cache only when a character is hidden or a 404 permission-gate applies). Any endpoint
  capable of returning restricted/permission-dependent data in some cases should simply
  be annotated as restricted outright, and skip cache on every response — not just the
  restricted ones. This is an intentional correctness fix: cacheability is decided
  **per endpoint**, not per response content — an endpoint that can ever return
  restricted/hidden data is restricted, full stop, even on the requests where it happens
  to return non-hidden data.
- Scope for this issue is limited to endpoints under `backend/games/views/` (the
  `/games/` path prefix). `accounts/` and `permissions/` keep their current manual
  handling for now; migrating them is a separate follow-up issue.
- Two decorators are introduced: `@restricted` and `@regular`. This issue only needs
  `@restricted` to set `X-Skip-Cache: true` unconditionally (mirroring today's
  behavior); `@regular` is a no-op for caching purposes today (regular endpoints already
  get the right `Cache-Control` from `CacheControlMiddleware`), but is introduced now as
  the explicit counterpart because there are future plans to give it its own behavior —
  every migrated view should end up annotated with one or the other, so no view is
  left undocumented about its cache tier.
- **Migration is incremental, not all-in-one.** This issue only introduces the
  `@restricted`/`@regular` decorators (with tests) and migrates a small representative
  slice to prove the pattern — the rest of the ~50 call sites across
  `backend/games/views/` move over in follow-up issues, grouped by sub-area (polls,
  characters, staff, documents/items/treasures, ...). This keeps each conditional-to-
  unconditional behavior change reviewable in its own small PR instead of landing across
  the whole games app at once. The representative slice for this issue is
  `backend/games/views/staff/*`: every endpoint there sets `X-Skip-Cache`
  unconditionally today, so migrating it to `@restricted` is a pure mechanical swap with
  no behavior change, validating the decorator cleanly. The conditional-to-unconditional
  cases (`_character_shared.py`, `_detail.py`, `_treasures.py`, `_photos.py`, etc.) are
  left for dedicated follow-up issues, since that's where the actual caching behavior
  change needs focused review.

## Benefits
- Removes roughly 50 duplicated, hand-written `X-Skip-Cache` assignments in favor of two
  declarative decorators.
- Fixes the caching-correctness bug where conditionally-restricted endpoints could serve
  cached restricted/hidden data.
- Establishes `@restricted`/`@regular` as the shared vocabulary for cache-tier
  annotation across the games app, ready to extend to `accounts/`/`permissions/` and to
  give `@regular` its own future behavior.
