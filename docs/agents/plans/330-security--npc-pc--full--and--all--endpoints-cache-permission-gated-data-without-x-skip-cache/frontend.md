# Frontend Plan: Security: NPC/PC 'full' and 'all' endpoints cache permission-gated data without X-Skip-Cache

Main plan: [plan.md](plan.md)

## Shared contracts

Send the request header `X-Skip-Cache: true` on:

- `CharacterClient#fetchNpcsAll` (`GET /games/:slug/npcs/all.json`)
- `CharacterClient#fetchNpcFull` / `#fetchPcFull` (`GET /games/:slug/{npcs,pcs}/:id/full.json`)
- `CharacterClient#fetchNpc` only (`GET /games/:slug/npcs/:id.json`) — **not** `#fetchPc`,
  which has no hidden-gate on the backend and is unaffected by this issue.

Backend already sets the matching `X-Skip-Cache: true` response header on all of the
above (see `backend.md`), so both sides of the cache-bypass convention line up.

## Implementation Steps

### Step 1 — Add `/full.json` and `/all.json` to the suffix allowlist

`frontend/assets/js/client/config/skipCacheSuffixes.js` already holds fixed path suffixes
that get `X-Skip-Cache: true` added automatically by `BaseClient#request`. Add the two
new suffixes used by the full/all endpoints:

```js
export default new Set([
  '/access.json',
  '/all.json',
  '/full.json',
]);
```

This covers `fetchNpcsAll`, `fetchNpcFull`, and `fetchPcFull` without touching
`CharacterClient.js` — verified there are no other current client calls ending in
`/all.json` or `/full.json` that would be unintentionally affected.

### Step 2 — Skip cache for plain NPC detail only

`CharacterClient#fetchNpc` and `#fetchPc` share the private `#fetchCharacter` method with
`suffix = null`, producing a path like `/games/:slug/npcs/:id.json` — not expressible as a
fixed suffix (the numeric id varies) and not shared with `#fetchPc`'s equivalent path, so
this cannot go through `skipCacheSuffixes.js`. Add the header explicitly, scoped to the
NPC (no-suffix) case only, in `#fetchCharacter`:

```js
#fetchCharacter(segment, gameSlug, characterId, token, suffix = null) {
  const base = `/games/${gameSlug}/${segment}/${characterId}`;
  const path = suffix ? `${base}/${suffix}.json` : `${base}.json`;
  const skipCache = segment === 'npcs' && suffix === null;

  return this.request(path, {
    headers: {
      Accept: 'application/json',
      ...(skipCache ? { 'X-Skip-Cache': 'true' } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
}
```

This affects only `fetchNpc` (segment `'npcs'`, no suffix). `fetchPc` (segment `'pcs'`)
and every suffixed call (`full`, `access`, `treasures`) are unaffected by this branch.

### Step 3 — Tests

Update/add Jasmine specs in `frontend/specs/assets/js/client/CharacterClientSpec.js`
(and `BaseClientSpec.js` if the suffix additions need their own coverage) asserting:

- `fetchNpcsAll` sends `X-Skip-Cache: true`
- `fetchNpcFull` and `fetchPcFull` send `X-Skip-Cache: true`
- `fetchNpc` sends `X-Skip-Cache: true`
- `fetchPc` does **not** send `X-Skip-Cache: true` (regression guard so the scoping in
  Step 2 doesn't silently widen later)

Follow the existing header-assertion style already used throughout
`CharacterClientSpec.js` / `CharacterClientPhotoRolesSpec.js`.

## Files to Change

- `frontend/assets/js/client/config/skipCacheSuffixes.js` — add `/all.json` and
  `/full.json` suffixes
- `frontend/assets/js/client/CharacterClient.js` — add `X-Skip-Cache` header for the
  plain NPC detail (no-suffix) request only
- `frontend/specs/assets/js/client/CharacterClientSpec.js` — add/extend header
  assertions per Step 3

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint_fix` (CI job: `frontend-checks`)

## Notes

- Do not add the header to `fetchPc` — PCs have no hidden-gate on the backend, so their
  plain detail response is not requester-dependent in a security-relevant way (see
  plan.md's Notes).
