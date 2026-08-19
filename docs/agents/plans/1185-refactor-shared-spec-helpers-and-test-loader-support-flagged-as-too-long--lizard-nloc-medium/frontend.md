# Frontend Plan: Refactor shared spec helpers and test-loader support flagged as too long (Lizard nloc-medium)

Main plan: [plan.md](plan.md)

## Overview

Codacy's `lizard` NLOC check flags 4 methods across 3 files: the giant `it` in `AppHelperSpec.js`, two anonymous methods in `HashRouteResolverSpec.js` (the `describe` body and its giant first `it`), and `load()` in `jsx-loader.mjs`. All four are fixed by genuine decomposition — no behavior change, no production code touched (`AppHelper.jsx`'s `PAGES` map and `HashRouteResolver.js`'s `ROUTES` table stay as-is).

## Implementation Steps

### Step 1 — Rewrite `AppHelperSpec.js` as a data-driven, per-domain split

Delete `frontend/specs/assets/js/components/helpers/AppHelperSpec.js` and replace it with a folder of the same base name:

```
frontend/specs/assets/js/components/helpers/AppHelperSpec/
  support.js
  gameRoutesSpec.js
  characterRoutesSpec.js
  staffAccountRoutesSpec.js
  miniatureRoutesSpec.js
```

`support.js` exports the shared case-runner, e.g.:

```js
import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../../assets/js/components/helpers/AppHelper.jsx';

export const runCases = (cases) => {
  cases.forEach(({ page, hash, expected, lang }) => {
    it(`renders ${page}`, function() {
      expect(renderToStaticMarkup(AppHelper.render(page, hash, lang))).toContain(expected);
    });
  });
};
```

(Adjust the relative import depth to match the new folder nesting — one level deeper than the original file.)

Each domain `*Spec.js` imports `runCases` from `./support.js` and wraps its own `CASES` array in `describe('AppHelper', function() { runCases(CASES); });`. Every `expect(...).toContain(...)` line from the current single `it` becomes one `{ page, hash, expected, lang? }` entry — copy the exact page key, hash, and expected substring from the current file, don't re-derive them.

Domain assignment (by page-key prefix, matching `AppHelper.jsx`'s own `PAGES` groupings):
- `characterRoutesSpec.js` — every `npcCharacter*` / `pcCharacter*` key.
- `staffAccountRoutesSpec.js` — `staffUsers`, `staffUser`, `staffUserEdit`, `myAccount`, `accountAuthorizationRequests`, `recoverPassword`, `register`.
- `miniatureRoutesSpec.js` — `stlModel*`, `source`, `sources`, `collection`, `collections`.
- `gameRoutesSpec.js` — everything else (`games`, `game*`, `myGames`, etc.). Also keep the two existing standalone its here (`falls back to home page for unknown page key`, `renders correctly when a language code is provided`) — both use the `games` page key, so they read naturally alongside the game cases; give them their own `describe`/`it` blocks (not `CASES` entries) since they exercise different behavior (fallback / lang param), not another render+expect row.

### Step 2 — Rewrite `HashRouteResolverSpec.js` as a data-driven, per-domain split

Delete `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec.js` and replace it with:

```
frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/
  support.js
  gameRoutesSpec.js
  characterRoutesSpec.js
  staffRoutesSpec.js
  miniatureRoutesSpec.js
  legacyRoutesSpec.js
```

`support.js` mirrors Step 1's shape:

```js
import HashRouteResolver from '../../../../../../assets/js/utils/routing/HashRouteResolver.js';

export const runCases = (cases) => {
  cases.forEach(({ hash, expected, description }) => {
    it(description ?? `resolves ${hash}`, function() {
      expect(new HashRouteResolver(() => hash).getPage()).toBe(expected);
    });
  });
};
```

Fold **both** the big `it('resolves known pages', ...)` list and every one of the ~50 descriptive regression `it`s below it into these same `CASES` arrays — a regression it like `it('resolves /games/new to gameNew, not game', ...)` becomes `{ hash: '#/games/new', expected: 'gameNew', description: 'resolves /games/new to gameNew, not game' }`. Don't drop any assertion; every existing `expect(...)` (from the big list and from every small it) must map to exactly one `CASES` entry. Where an entry already appears in the big list under a plain hash and is re-asserted by a descriptive it with the same hash/expected pair, keep only one `CASES` entry for it (the descriptive one, since it documents the ambiguity/precedence being protected) rather than two near-duplicate rows.

Domain assignment (by page-key/path, same character-domain override as Step 1):
- `characterRoutesSpec.js` — any hash containing `/npcs/` or `/pcs/` (even though nested under `/games/:game_slug/`), matching `npcCharacter*`/`pcCharacter*`.
- `staffRoutesSpec.js` — `/staff/*` hashes (`staffUsers`, `staffUser`, `staffUserEdit`, `staffDashboard` if present).
- `miniatureRoutesSpec.js` — `/miniatures/*` hashes.
- `legacyRoutesSpec.js` — the negative/dropped-route cases with no `ROUTES` entry: `no longer resolves the old top-level /stl_models to stlModels`, `no longer resolves /stl_models/new (the "new" page/route was dropped)`, `falls back to home for unknown routes`.
- `gameRoutesSpec.js` — everything else (`/games/...` without `/npcs/`/`/pcs/`, `/recover-password`, `/users/register`, `/account/authorization_requests`, `/my_account`, `/my-games`, `/` → home).

### Step 3 — Decompose `jsx-loader.mjs`'s `load()`

In `frontend/specs/support/jsx-loader.mjs`, extract each of `load()`'s 6 branches into its own named function, each returning the load-result object or `null`/`undefined` when the branch doesn't apply to the given `url`:

- `handleRawImport(url)` — the `?raw` branch (lines 45-54 today).
- `handleJsxTransform(url)` — the `.jsx` branch (lines 55-71).
- `handleStyleStub(url)` — `.css`/`.scss` (lines 72-79).
- `handleBootstrapStub(url)` — `/bootstrap/dist/js/` (lines 80-87).
- `handleImageStub(url)` — `stub:image:` (lines 88-96).
- `handleViteEnvShim(url)` — the trailing `.js` + `import.meta.env` branch (lines 97-111).

Keep each handler's internal logic byte-for-byte identical to today (same `readFileSync`/`transformSync` calls, same `// eslint-disable-next-line security/detect-non-literal-fs-filename` comments carried over onto their new lines). `load()` itself becomes:

```js
export async function load(url, context, nextLoad) {
  return (
    handleRawImport(url) ??
    handleJsxTransform(url) ??
    handleStyleStub(url) ??
    handleBootstrapStub(url) ??
    handleImageStub(url) ??
    handleViteEnvShim(url) ??
    nextLoad(url, context)
  );
}
```

`resolve()` is untouched (it's not flagged and is already well under the limit). Update the file's JSDoc as needed for the new helper functions (short, one-line — match the existing terse style, don't over-document).

### Step 4 — Verify

Run the frontend test suite and lint locally (see CI Checks below) and confirm:
- All previously-passing assertions still pass — same coverage, same pass/fail outcomes, just reorganized.
- No leftover references to the deleted `AppHelperSpec.js` / `HashRouteResolverSpec.js` single files anywhere (imports, docs).
- Codacy's `lizard` check would now pass for all 4 previously-flagged spots — spot-check by eyeballing that no generated file/function exceeds ~50 lines (the `CASES.forEach`-driven files should all be far under it; `load()` should be a handful of lines plus the `??` chain).

## Files to Change

- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js` — delete, replaced by `AppHelperSpec/` folder.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec/support.js` — new.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec/gameRoutesSpec.js` — new.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec/characterRoutesSpec.js` — new.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec/staffAccountRoutesSpec.js` — new.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec/miniatureRoutesSpec.js` — new.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec.js` — delete, replaced by `HashRouteResolverSpec/` folder.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/support.js` — new.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/gameRoutesSpec.js` — new.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/characterRoutesSpec.js` — new.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/staffRoutesSpec.js` — new.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/miniatureRoutesSpec.js` — new.
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/legacyRoutesSpec.js` — new.
- `frontend/specs/support/jsx-loader.mjs` — decompose `load()` into 6 named handler functions + a thin dispatch chain.

## CI Checks

- `frontend`: `npm run coverage` (or `npm test` for a faster no-coverage run) — CI job `jasmine`. The test glob is `specs/**/*[sS]pec.js` (`frontend/package.json`), so every new `*Spec.js` file above is auto-discovered; `support.js` files are not (by design — they hold no `describe`/`it`).
- `frontend`: `npm run lint` — CI job `frontend-checks`.

## Notes

- The test-runner glob (`specs/**/*[sS]pec.js`) is a hard constraint: any wiring/index file that doesn't end in `Spec.js` would silently never run. Do not introduce an `index.js` in either new folder.
- This mirrors the repo's existing split-spec-folder precedent at `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/` (support.js + several `*Spec.js` files) — match its style (plain `export const`/`export default` helpers in `support.js`, relative import from each `*Spec.js`).
- Exact case-to-file placement for a handful of edge-case routes (e.g. any hash that doesn't cleanly match one prefix) is a judgment call — keep it defensible and consistent with the domain rules above; it doesn't need to be perfect, only correct (no dropped or duplicated assertions) and readable.
