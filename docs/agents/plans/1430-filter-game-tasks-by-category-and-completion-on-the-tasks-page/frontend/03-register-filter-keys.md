# Register the task filter keys in HashRouteResolver

`HashRouteResolver#getFilterParams()` only returns hash params listed in its `FILTER_KEYS`
constant. Add `'category'` and `'completed'` to it; otherwise the Tasks page filters would never
reach the request, the draft selects wouldn't be pre-populated, and pagination links would drop
them. No other page uses these param names, so this has no side effect elsewhere.

Add a case to `HashRouteResolverParamsSpec.js` checking that
`#/games/demo/tasks?page=2&category=painting&completed=false` yields `category` and `completed`
(and not `page`).

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — extend `FILTER_KEYS`.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverParamsSpec.js` — new case.
