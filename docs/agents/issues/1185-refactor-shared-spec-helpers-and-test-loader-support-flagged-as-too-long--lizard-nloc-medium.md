# Issue: Refactor shared spec helpers and test-loader support flagged as too long (Lizard nloc-medium)

## Description

Sub-issue of #1167 (itself a sub-issue of #1152). Codacy's `Lizard` complexity analyzer flags 4 methods across 3 files — a general Jasmine spec helper, a routing spec, and the Jasmine JSX test loader support script — as exceeding the 50-NLOC-per-method limit.

## Problem

These specs and the loader script mix several test scenarios or setup concerns in one long method/function, making them harder to read and maintain. `frontend/specs/support/jsx-loader.mjs` is not a component or a spec — it's build/test infrastructure (a Node ESM loader that transpiles JSX for Jasmine) — so its refactor is a plain function decomposition rather than a component/spec split.

## Expected Behavior

Each method below drops back under its 50-NLOC limit through genuine sub-responsibility extraction — split specs by extracting shared setup/assertion helpers or breaking up long `it`/anonymous blocks, and split the loader function by extracting cohesive steps of its transform pipeline — following the project's existing pattern of splitting test files and extracting shared setup helpers, per the Definition of Done strengthened in #1152.

## Solution

For each occurrence, identify the distinct sections/responsibilities being mixed together and extract them into well-named helper methods or functions.

### Occurrences (4, across 3 files)

- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js`
  - line 6: Method (anonymous) has 67 lines (limit 50)
  - **Decomposition decided**: `AppHelper.render()` is a flat page-key → component lookup table, so the giant `it` (one `expect(...).toContain(...)` per page key) is really one row of a table per line. Convert it to a data-driven test: a `CASES` array of `{ page, hash, expected, lang? }` entries, iterated with `CASES.forEach(({ page, hash, expected, lang }) => it(`renders ${page}`, ...))` to generate one `it` per page key. Each generated `it` body is ~2 lines, so NLOC stops being a concern, and a failure now points at exactly which page key broke instead of aborting a single monolithic test on the first failed assertion. The existing `falls back to home page for unknown page key` and `renders correctly when a language code is provided` `it`s stay as-is alongside the generated cases.
    On top of the data-driven rewrite, also split the spec into one file per page-context, following the project's existing split-spec-folder precedent (`frontend/specs/.../header/helpers/HeaderHelper/`, from #1186/#1190): **each domain gets its own full `*Spec.js` file with its own `describe(...)` block** — the test runner only discovers files matching `specs/**/*[sS]pec.js` (`frontend/package.json`'s `spec_files` glob), so a non-`Spec.js` wiring/index file would silently never run. Any shared setup helper goes in a `support.js` (doesn't match the glob, imported by each `*Spec.js`), mirroring `HeaderHelper/support.js`:
    ```
    frontend/specs/assets/js/components/helpers/AppHelperSpec/
      support.js               # shared render-and-expect helper, if one earns its keep
      gameRoutesSpec.js         # describe('AppHelper', () => { CASES.forEach(...) }) — games/, game*, gameSession*, gameTasks, myGames, etc.
      characterRoutesSpec.js    # npcCharacter*/pcCharacter*
      staffAccountRoutesSpec.js # staff*, myAccount, accountAuthorizationRequests, recoverPassword, register
      miniatureRoutesSpec.js    # stlModel*, source*, collection*, treasure*
    ```
    Exact grouping/filenames are an implementation detail for the planning step; the domains above are illustrative, mirroring the existing PAGES groupings in `AppHelper.jsx`. The two standalone its (`falls back to home page for unknown page key`, `renders correctly when a language code is provided`) go wherever they fit best (likely their own small `*Spec.js` or folded into one of the domain files).
- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec.js`
  - line 3: Method (anonymous) has 75 lines (limit 50)
  - line 4: Method (anonymous) has 57 lines (limit 50)
  - **Decomposition decided**: this file is basically `HashRouteResolver.js`'s `ROUTES` table tested in reverse (hash → page key). Both violations come from the same root cause — line 4 is the giant `it('resolves known pages', ...)` with ~55 one-line asserts, and line 3's `describe` is bloated by the ~50 *additional* small `it`s below it (e.g. `still resolves /miniatures/collections to collections`), most of which just re-assert an entry already covered by the big list under a descriptive name. Fix: fold everything — the big list and the descriptive regression cases alike — into data-driven `CASES` arrays of `{ hash, expected, description? }`, iterated with `CASES.forEach(({ hash, expected, description }) => it(description ?? `resolves ${hash}`, ...))`, generating one `it` per case (description defaults to the hash when the case doesn't need special callout text). This collapses the describe body from ~55 individual statements down to a handful of `forEach` calls, fixing both violations together. Then split the `CASES` arrays into per-domain files, mirroring the AppHelperSpec split decision above:
    Same correction as `AppHelperSpec` above applies here: the test runner only discovers `specs/**/*[sS]pec.js`, so each domain file must itself be a full `*Spec.js` with its own `describe(...)` — no shared `index.js` wiring file (it would never run). A `support.js` can hold any shared setup, mirroring `HeaderHelper/support.js`.
    ```
    frontend/specs/assets/js/utils/routing/HashRouteResolverSpec/
      support.js             # shared setup, if one earns its keep
      gameRoutesSpec.js
      characterRoutesSpec.js
      staffRoutesSpec.js
      miniatureRoutesSpec.js
      legacyRoutesSpec.js    # e.g. old top-level /stl_models no longer resolving, dropped /stl_models/new
    ```
    Exact grouping/filenames are an implementation detail for the planning step.
- `frontend/specs/support/jsx-loader.mjs`
  - line 44: Method load has 62 lines (limit 50)
  - **Decomposition decided**: unlike the two spec files above, `load()` isn't a list of near-identical assertions — it's a Node ESM loader hook with 6 distinct branches (`?raw` text import, `.jsx` transform, CSS/SCSS stub, bootstrap-bundle stub, image stub, `import.meta.env` shim), each doing real `readFileSync`/transform work, falling back to `nextLoad`. Extract each branch into its own small named function (`handleRawImport(url)`, `handleJsxTransform(url)`, `handleStyleStub(url)`, `handleBootstrapStub(url)`, `handleImageStub(url)`, `handleViteEnvShim(url)`), each returning the load-result object or `null`/`undefined` when it doesn't apply. `load()` itself collapses to a `??`-chain of these handlers ending in `nextLoad(url, context)`. No file split for this one — it's infra code (not a test file), so the project's test-file-split precedent doesn't apply, and 113 lines doesn't warrant multi-file ceremony.

### Scope

- **In scope**: only the 4 flagged occurrences, across exactly the 3 files listed above — no broader sweep of other specs.
- **In scope**: file/folder restructuring needed to carry out the decompositions decided above (new `AppHelperSpec/` and `HashRouteResolverSpec/` folders with per-domain `*Spec.js` files and an optional `support.js`).
- **Out of scope**: production source changes. `AppHelper.jsx`'s `PAGES` map and `HashRouteResolver.js`'s `ROUTES` table are not flagged and stay untouched — this is a test/infra-only refactor.
- **Out of scope**: behavior changes. All 3 files keep asserting exactly what they assert today; this is a pure structural refactor (same test coverage, same pass/fail outcomes), not a chance to add/remove test cases.
- **Out of scope**: deduplicating the page-key list that's effectively defined twice (once as `AppHelper.jsx`'s `PAGES` keys, once as `HashRouteResolver.js`'s `ROUTES` values, and mirrored again in both specs' new `CASES` tables). Worth a future issue, not this one.

### Alternative Solutions Considered

Considered exempting `frontend/specs/**` (and/or `frontend/specs/support/**`) from Codacy's `lizard` check in `.codacy.yml`, since that file already excludes `frontend/specs/**` from the `duplication` engine. Rejected: duplication in specs is a different kind of noise (repeated setup boilerplate across files, which doesn't hurt readability the way a single 300-line `describe` block does), whereas the NLOC violations here genuinely make these files harder to read/maintain. This issue's Expected Behavior already ties the approach to the Definition of Done strengthened in #1152, and every sibling sub-issue (#1183/#1184/#1186/#1189) refactored rather than suppressed — refactor stays the approach.

## Benefits

Improved readability, reusability, and testability of shared spec helpers and the test-loader support script; passes the Codacy Lizard check.
