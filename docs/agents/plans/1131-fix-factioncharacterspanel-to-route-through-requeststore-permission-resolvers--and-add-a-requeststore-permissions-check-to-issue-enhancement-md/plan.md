# Plan: Fix FactionCharactersPanel to route through RequestStore permission resolvers, and add a RequestStore/permissions check to issue-enhancement.md

Issue: [1131_fix-factioncharacterspanel-to-route-through-requeststore-permission-resolvers--and-add-a-requeststore-permissions-check-to-issue-enhancement-md.md](../issues/1131-fix-factioncharacterspanel-to-route-through-requeststore-permission-resolvers--and-add-a-requeststore-permissions-check-to-issue-enhancement-md.md)

## Overview

`FactionCharactersPanelController` currently imports `AccessStore` directly and
calls `AccessStore.ensureGamePermissions(gameSlug)` from its own `isDmOrAdmin`
method, in parallel with the `RequestStore.ensure` call `fetchPage()` already
makes for the same game's `faction.characters` permissions. This bypasses the
`RequestStore`/`RequestPermissionResolvers` pattern every other resource
controller follows. Investigation confirmed (see the issue's Context section)
that mutation auto-pick (adding a `faction.remove` resolver) is *not* the
right fix — `RequestStore.mutate`'s `variantName` param is deliberately
reserved for exactly this "already-decided-from-a-resolved-permission"
case — so the fix is to have `isDmOrAdmin` call
`RequestPermissionResolvers.resolve('faction', 'characters', { gameSlug })`
directly instead of `AccessStore.ensureGamePermissions`, removing the direct
`AccessStore` dependency while keeping the kick action's explicit
`variantName`. A small docs update captures the pattern for future issues.

## Context

See the issue file for full investigation detail. Key facts:

- `RequestPermissionResolvers.RESOLVERS.faction.characters` already resolves
  `{ can_edit }` via `AccessStore.ensureGamePermissions(gameSlug)`
  (`frontend/assets/js/utils/requests/RequestPermissionResolvers.js:98`) — the
  exact same call `isDmOrAdmin` makes today, just reached through a different
  entry point.
- `RequestStore.mutate`'s `variantName` param
  (`frontend/assets/js/utils/requests/RequestStore.js:78-82`) exists
  specifically so a caller can pass an already-resolved decision instead of
  triggering a fresh (possibly-stale-relative-to-the-payload) permission
  re-check — this is why `remove`/`acquire` in `factionConfig.js` keep
  `permission` "documentation-only" and expect explicit `variantName`. No
  `faction.remove` resolver should be added.
- `Request#ensure` (`frontend/assets/js/utils/requests/Request.js`) only ever
  resolves `{ data, pagination }` to its caller — it does not expose the
  permissions object it resolved internally. So `isDmOrAdmin` cannot be
  derived from `fetchPage()`'s return value; it must independently call
  `RequestPermissionResolvers.resolve(...)`, which is still correct because
  that resolver is the same `AccessStore.ensureGamePermissions` call,
  deduped via `AccessCache` when both calls land in the same tick (see
  `AccessCache.ensure` in `frontend/assets/js/utils/access/AccessCache.js`).

## Implementation Steps

### Step 1 — Route `isDmOrAdmin` through `RequestPermissionResolvers`

In `frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js`:

- Replace the `AccessStore` import with a `RequestPermissionResolvers` import.
- Change `isDmOrAdmin(gameSlug)` to call
  `RequestPermissionResolvers.resolve('faction', 'characters', { gameSlug })`
  instead of `AccessStore.ensureGamePermissions(gameSlug)`, keeping the same
  `.then((permissions) => Boolean(permissions.can_edit)).catch(() => false)`
  shape (never rejects; fails closed to `false`).
- Update the class-level `@description` JSDoc block (currently describing the
  `AccessStore.ensureGamePermissions` call) to reflect the new
  `RequestPermissionResolvers`-based call, keeping the existing explanation of
  *why* `isDmOrAdmin` and `fetchPage()`'s permission check are the same
  source of truth.
- Double-check no other method in the file references `AccessStore` — if
  none do, drop the import entirely.

### Step 2 — Update Jasmine specs

In `frontend/specs/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelControllerSpec.js`:

- Replace the `AccessStore` import/spy setup
  (`spyOn(AccessStore, 'ensureGamePermissions')...` in the top-level
  `beforeEach`, and the per-test `AccessStore.ensureGamePermissions.and.returnValue(...)`
  calls in `#isDmOrAdmin` and `#buildEffect` describe blocks) with
  `RequestPermissionResolvers` spies:
  `spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: ... }))`.
- In the `#isDmOrAdmin` describe block, assert the resolver is called with
  `('faction', 'characters', { gameSlug: 'demo' })` (mirroring today's
  assertion that `AccessStore.ensureGamePermissions` was called with
  `'demo'`).
- Leave the `#fetchPage`/`#kick`/`#confirmKick` describe blocks' `RequestStore`
  spies untouched — the mutation path (`RequestStore.mutate` with explicit
  `variantName`) does not change.
- No changes needed to `RequestPermissionResolversSpec.js` — no new resolver
  entry is being added (the issue explicitly rules that out).

### Step 3 — Add the "Permissions" checklist item to `issue-enhancement.md`

In `docs/agents/issue-enhancement.md`, add a new bullet after "Backward
compatibility" (or wherever best fits alongside the existing items), e.g.:

```markdown
- **Permissions** — who can access or act on the feature, and how that access
  is resolved. For reads, endpoint-variant selection (regular vs.
  restricted/permission-gated) must go through `RequestStore`'s
  permission-resolver auto-pick mechanism (`RequestPermissionResolvers.js`)
  rather than calling `AccessStore` directly, unless there is a documented
  reason to bypass it. For mutations, an explicit `variantName` derived from
  an already-resolved permissions check (see `RequestStore.mutate`'s
  `variantName` param) is the established exception, to avoid a stale
  re-check picking a different variant than the payload was built for — but
  that already-resolved check should still come from the same
  `RequestStore`/`RequestPermissionResolvers` read path, not a redundant
  direct `AccessStore` call.
```

## Files to Change

- `frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js` — swap `AccessStore.ensureGamePermissions` for `RequestPermissionResolvers.resolve('faction', 'characters', ...)` in `isDmOrAdmin`; drop the `AccessStore` import; update JSDoc.
- `frontend/specs/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelControllerSpec.js` — swap `AccessStore` spies for `RequestPermissionResolvers.resolve` spies; update assertions.
- `docs/agents/issue-enhancement.md` — add the new "Permissions" checklist item.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No backend, proxy, cache, or infra changes — this is a frontend-only code
  fix plus a docs-only addition.
- No behavioral change expected: DM/admin users still see the full character
  list and can still kick; non-DM/admin users still see the restricted list
  and cannot kick. The fix only changes *how* `isDmOrAdmin` is resolved, not
  its resulting value or the kick action's variant selection.
- Explicitly out of scope (confirmed during discussion, see issue Context):
  adding a `faction.remove`/`faction.acquire` resolver to
  `RequestPermissionResolvers.js`. Do not add one.
