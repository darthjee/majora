# Frontend Plan: Session detail response caches stale can_edit — migrate to dedicated /permissions.json endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

- `GET /games/:game_slug/sessions/:id.json` no longer returns `can_edit` — do not rely on it
  from `sessionClient.fetchSession()`'s response body anymore.
- Reuse the existing, already-implemented `AccessStore.ensureGamePermissions(gameSlug)` /
  `AccessStore.getGamePermissions(gameSlug)` (same ones `GameController` already uses) — no new
  store method, no new client method. `getGamePermissions` returns a fail-closed
  `{ can_edit: false }` default before the fetch resolves.
- `session.game_slug` is already present on the fetched session object (and is also available
  directly from the route params before the fetch even resolves), so the permissions fetch can
  key off either.

## Implementation Steps

### Step 1 — Import `AccessStore` into `GameSessionController`

In `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js`,
add `import AccessStore from '../../../../../utils/access/store/AccessStore.js';` (same relative
depth pattern as `GameController.js`'s import of the same module).

### Step 2 — Merge permissions into session state, mirroring `GameController`

Replace the current `#fetchSession` `.then((session) => safeSet(this.setSession, session))` step
with a two-phase render, following `GameController`'s `#renderGame`/`#mergeAccess` pattern:

```js
#fetchSession(gameSlug, id, safeSet) {
  const token = AuthStorage.getToken();

  this.sessionClient.fetchSession(gameSlug, id, token)
    .then((response) => (response.ok
      ? response.json()
      : Promise.reject(new Error('session failed'))))
    .then((session) => this.#renderSession(gameSlug, session, safeSet))
    .catch(() => safeSet(this.setError, 'Unable to load session.'))
    .finally(() => safeSet(this.setLoading, false));
}

#renderSession(gameSlug, session, safeSet) {
  safeSet(this.setSession, this.#mergePermissions(gameSlug, session));

  AccessStore.ensureGamePermissions(gameSlug)
    .then(() => safeSet(this.setSession, this.#mergePermissions(gameSlug, session)));
}

#mergePermissions(gameSlug, session) {
  return { ...session, ...AccessStore.getGamePermissions(gameSlug) };
}
```

Note `.finally(() => safeSet(this.setLoading, false))` stays on the original chain (loading
clears once the session itself has loaded — same UX as `GameController`, which does not wait on
the access/permissions fetch to clear loading either).

Use `session.game_slug` from the fetched payload for the `gameSlug` argument to
`#renderSession`/`#mergePermissions` (it's already resolved for the `.then` callback and matches
what `GameController` does — using the object's own `game_slug` rather than the outer closure
variable keeps this consistent even though, in practice, both values are identical here).

### Step 3 — Update `GameSessionControllerSpec.js`

In `frontend/specs/assets/js/components/resources/game_session/pages/controllers/GameSessionControllerSpec.js`:
- Add a `stubEnsureGamePermissions` call at the top of each existing `#buildEffect` test (reuse
  the existing shared helper from
  `frontend/specs/assets/js/components/resources/game/pages/controllers/GameController/support.js`
  — it is generic over `game_slug`, nothing session-specific needed; import it from there, or if
  the cross-directory import reads awkwardly, add a thin
  `GameSessionController/support.js` that re-exports it, matching this project's existing
  spec-support conventions).
- Update the resolved `fetchSession` fixtures to no longer include `can_edit` in the raw session
  JSON (since the backend won't send it anymore), and instead assert `setSession` is eventually
  called with `can_edit` sourced from the stubbed `AccessStore.getGamePermissions` value (e.g.
  stub `{ can_edit: true }` and assert the final `setSession` call includes it).
- Add a new test asserting the fail-closed intermediate render: immediately after `buildEffect`
  fires (before the permissions promise resolves), `setSession` is called once with
  `can_edit: false` merged in, then called again with the resolved value once
  `ensureGamePermissions` settles — mirroring `GameController`'s
  "renders immediately with fail-closed access/permissions, then re-renders" test.

### Step 4 — Confirm no other frontend file needs changes

- `GameSessionHelper.jsx` already reads `session.can_edit` for both the "Edit" and "Create Pool"
  buttons — no change needed there, since `session.can_edit` still exists on the object passed to
  `GameSessionHelper.render`, just sourced differently now.
- `GameSessionClient.js` needs no new method — the existing `GameClient.fetchGamePermissions`
  (used internally by `AccessStorePermissions`) already covers this.
- `GameSessionHelperSpec.js` needs no change — it tests the helper in isolation with a plain
  `session` object, independent of where `can_edit` came from.

## Files to Change

- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js`
  — import `AccessStore`, add `#renderSession`/`#mergePermissions`, wire into `#fetchSession`.
- `frontend/specs/assets/js/components/resources/game_session/pages/controllers/GameSessionControllerSpec.js`
  — stub `AccessStore.ensureGamePermissions`/`getGamePermissions` in existing tests; update
  fixtures; add a fail-closed-then-resolved render test.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`) — runs the updated `GameSessionControllerSpec.js`.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — lints the modified controller/spec.
- Run via docker-compose per `AGENTS.md`, e.g. `docker-compose run --rm majora_fe npm test`.

## Notes

- Land this together with (or immediately after) the backend change — if the backend removal of
  `can_edit` ships first without this frontend change, every session page visitor (including
  DMs) will see `can_edit` as `undefined`/falsy and lose the "Edit"/"Create Pool" buttons until
  this lands.
- `GameSessionEditController.js` (`frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionEditController.js`)
  was not found to read `can_edit` from the session fetch in this plan's research, but it's worth
  a quick check while implementing — if it does, it should get the same treatment (or simply rely
  on the fact that the edit route already redirects away when unauthorized, if that's how it
  currently guards access) to avoid a second, easy-to-miss instance of the same stale-cache bug.
