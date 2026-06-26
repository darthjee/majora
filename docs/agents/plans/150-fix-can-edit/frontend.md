# Frontend Plan: Fix Can Edit

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent adds a request header only. No API endpoint or response shape changes.

## Implementation Steps

### Step 1 — Add X-Skip-Cache header to access fetches in CharacterClient

In `frontend/assets/js/client/CharacterClient.js`, the private `#fetchCharacter` method builds all character fetch requests. The access endpoints (`/games/:slug/pcs/:id/access.json` and `/games/:slug/npcs/:id/access.json`) must send `X-Skip-Cache: 1` so the Tent proxy never serves a cached response.

Since `#fetchCharacter` is shared by all character fetches (detail, full, access), the cleanest approach is to add an optional `extraHeaders` parameter to `#fetchCharacter` and pass `{ 'X-Skip-Cache': '1' }` only when the suffix is `'access'`. Alternatively, extract `fetchPcAccess` and `fetchNpcAccess` to call `#fetchCharacter` with an explicit extra-headers argument.

Concrete approach — add an `extraHeaders` parameter to `#fetchCharacter`:

```js
#fetchCharacter(segment, gameSlug, characterId, token, suffix = null, extraHeaders = {}) {
  const base = `/games/${gameSlug}/${segment}/${characterId}`;
  const path = suffix ? `${base}/${suffix}.json` : `${base}.json`;

  return this.request(path, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...extraHeaders,
    },
  });
}
```

Then update `fetchPcAccess` and `fetchNpcAccess` to pass the extra header:

```js
fetchPcAccess(gameSlug, characterId, token) {
  return this.#fetchCharacter('pcs', gameSlug, characterId, token, 'access', { 'X-Skip-Cache': '1' });
}

fetchNpcAccess(gameSlug, characterId, token) {
  return this.#fetchCharacter('npcs', gameSlug, characterId, token, 'access', { 'X-Skip-Cache': '1' });
}
```

### Step 2 — Update CharacterClientSpec to assert the X-Skip-Cache header

In `frontend/specs/assets/js/client/CharacterClientSpec.js`, the existing specs for `#fetchPcAccess` and `#fetchNpcAccess` check the fetch call but do not assert `X-Skip-Cache: 1`. Update both existing spec cases and add a dedicated case:

For `#fetchPcAccess`:
- Update the "sends the auth token when present" case to include `'X-Skip-Cache': '1'` in the expected headers.
- Update the "omits the Authorization header when there is no token" case similarly.

For `#fetchNpcAccess`:
- Same updates.

All other methods (`fetchPc`, `fetchPcFull`, `fetchNpc`, `fetchNpcFull`, `updatePc`, `updateNpc`) must **not** include `X-Skip-Cache` — verify no existing passing spec breaks.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `extraHeaders` param to `#fetchCharacter`, pass `{ 'X-Skip-Cache': '1' }` from `fetchPcAccess` and `fetchNpcAccess`
- `frontend/specs/assets/js/client/CharacterClientSpec.js` — update expected headers in `#fetchPcAccess` and `#fetchNpcAccess` spec blocks

## CI Checks

- `frontend/`: `docker-compose run majora_frontend npm run coverage` (CI job: `jasmine`)

## Notes

- `BaseClient.request` already merges headers via spread, so the `extraHeaders` approach composes cleanly without touching `BaseClient` or `skipCacheEndpoints.js`.
- The static `skipCacheEndpoints.js` set is intentionally left unchanged — it exists for fixed paths; access paths are dynamic and are better handled at the call site.
