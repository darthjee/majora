# Plan: Change of page reloads first page

Issue: [310-change-of-page-reloads-first-page.md](../issues/310-change-of-page-reloads-first-page.md)

## Overview

`GameNpcsController#fetchNpcs` fetches the public NPC list (`npcs.json`, paginated from
the current hash) and, for DM/admin users, the full NPC list (`npcs/all.json`, always
unpaginated). Since the rendered rows come entirely from the `all` response when it
succeeds, DM/admin users never actually page through NPCs — they keep seeing the first
page, while the pagination controls (driven by the public response) look like they moved.
This plan forwards the current page/per_page to the `all` request and drives the
pagination UI from the `all` response's own headers whenever that response is the one
being displayed.

## Context

- `frontend/assets/js/components/pages/controllers/GameNpcsController.js` builds both
  requests independently in `#fetchNpcs`.
- `CharacterClient#fetchNpcsAll(gameSlug, token, params = {})` already accepts a `params`
  object and forwards it as a query string, but the controller never passes one.
- `GenericClient#fetchIndex` resolves `page`/`per_page` from the current hash via
  `HashRouteResolver#getPaginationParams()` and returns `{ data, pagination }`, where
  `pagination` is parsed from the `page`/`pages`/`per_page` response headers.
- `CharacterClient#fetchNpcsAll` returns a raw `Response` (not the `{ data, pagination }`
  shape produced by `fetchIndex`), so `#tryGetAuthNpcs`/`#applyAuthNpcs` only ever look at
  the parsed JSON body today, discarding the response headers.
- The backend `/games/:game_slug/npcs/all.json` endpoint already supports `page`/
  `per_page` via the same `paginated_list_response` helper used by `npcs.json`
  (`source/games/views/characters/game_npcs_all.py`, `source/games/views/common.py`), so
  no backend change is needed.

## Implementation Steps

### Step 1 — Forward pagination params to the `all` request

In `GameNpcsController#fetchNpcs`, resolve the same pagination params used for the public
request and pass them to `characterClient.fetchNpcsAll(gameSlug, token, params)`. Reuse
`HashRouteResolver#getPaginationParams()` (already used internally by `GenericClient`) so
both requests are built from the identical `page`/`per_page` values read from the current
hash — do not hand-roll a second parser. Since `GenericClient` doesn't expose its internal
resolver, either:
- instantiate a small helper (e.g. a local `HashRouteResolver`) in the controller to
  compute `{ page, per_page }` once and reuse it for both calls, or
- add a thin accessor if that turns out cleaner during implementation.
Pick whichever keeps the controller simplest; there is no shared contract with another
agent to preserve here.

### Step 2 — Parse pagination headers from the `all` response

Update `#tryGetAuthNpcs` (or introduce a sibling helper) to, on a successful `all`
response, also parse `page`/`pages`/`per_page` from its headers the same way
`GenericClient#fetchIndex` does, and return both the parsed NPC array and that pagination
object (e.g. `{ npcs, pagination }` instead of just the array). Keep the `null` return
value for the "fall back to public" case unchanged.

### Step 3 — Drive the pagination UI from the `all` response when it's displayed

Update `#applyAuthNpcs` to set pagination from the `all` response's own parsed headers
(from Step 2) instead of always using `publicResult.value.pagination`. `#applyPublicNpcs`
(the fallback path) is unaffected and keeps using the public response's pagination.

### Step 4 — Update/extend specs

Update `frontend/specs/assets/js/components/pages/controllers/GameNpcsControllerSpec.js`:
- The existing test `'uses the authenticated NPC list when the auth fetch succeeds'`
  currently asserts `characterClient.fetchNpcsAll` is called with only
  `('demo', 'mytoken')` — update it (and the mocked `fetchNpcsAll` response) to also
  assert the forwarded `page`/`per_page` params, and to return `page`/`pages`/`per_page`
  headers distinct from the public response's, asserting `setPagination` is called with
  the `all` response's own pagination values (not the public response's).
- Add a case where the current hash carries `?page=2&per_page=16` and assert both
  `client.fetchIndex` (already reads this from the hash) and
  `characterClient.fetchNpcsAll` are called with matching `page`/`per_page`.
- Keep the existing fallback tests (`falls back to the public NPC list when...`) passing
  unchanged, since those paths still use the public response's pagination.

## Files to Change

- `frontend/assets/js/components/pages/controllers/GameNpcsController.js` — forward
  page/per_page to `fetchNpcsAll`; parse and use the `all` response's own pagination
  headers when displaying the `all` list.
- `frontend/specs/assets/js/components/pages/controllers/GameNpcsControllerSpec.js` —
  update/add specs covering forwarded pagination params and the `all` response's own
  pagination headers driving the UI.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `checks`)

## Notes

- No backend, infra, or proxy changes are required — the `all` endpoint already supports
  pagination; this is purely a frontend request/response-wiring gap.
- `CharacterClient#fetchNpcsAll`'s signature (`gameSlug, token, params`) already supports
  what's needed; no client method signature changes are required, only how the controller
  calls it and reads its response.
