# Translator Plan: Explore generating the i18n loader manifest to remove en/pt duplication

Main plan: [plan.md](plan.md)

## Overview

Codacy flags `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js` as a 151-line clone pair: both hand-type an identical `chunkLoaders` map (one `() => import('./<namespace>.yaml?raw')` entry per translation namespace). Replace the hand-typed map in each file with a small `Proxy` that computes the same lazy import thunk on demand from the requested namespace name, eliminating the hand-maintained enumeration while preserving the exact eager/lazy loading split described in `docs/agents/i18n.md`.

## Context

- `import.meta.glob` (the issue's original idea) was explicitly rejected during refinement: `docs/agents/i18n.md` already documents that it can't be used here, because the Jasmine test suite imports `en/index.js`/`pt/index.js` directly under plain Node (via the custom `frontend/specs/support/jsx-loader.mjs` ESM loader), and `import.meta.glob` is a Vite-only compile-time macro with no Node equivalent.
- The chosen approach keeps `chunkLoaders` as a real, mutable object (so `TranslationLoaderSpec.js`/`TranslatorSpec.js`'s existing `en.chunkLoaders[namespace] = fakeFn` fixture-injection seam keeps working untouched) but computes its entries via a `Proxy` `get` trap instead of hand-typing them.
- `TranslationLoader.js`, `Translator.js`, and all spec files are explicitly **out of scope** — none of them need code changes. Only the two `index.js` manifests and the architecture doc change.
- `commonNamespaces` (the other hand-maintained list in these same files) is explicitly **out of scope** for this issue — it's data about `common.yaml`'s content, not a file listing, and can't be derived the same way.

## Implementation Steps

### Step 1 — Replace `chunkLoaders` in `frontend/assets/i18n/en/index.js`

Replace the hand-typed `chunkLoaders` object literal with:

```js
const chunkLoaders = new Proxy({}, {
  get: (target, namespace) =>
    namespace in target ? target[namespace] : () => import(`./${namespace}.yaml?raw`),
});
```

Keep the existing eager `import common from './common.yaml?raw';` and `commonNamespaces` array untouched — only the `chunkLoaders` block changes. Keep the `export default common; export { chunkLoaders, commonNamespaces };` line as-is.

### Step 2 — Replace `chunkLoaders` in `frontend/assets/i18n/pt/index.js`

Same change as Step 1 — the resulting file is byte-identical to `en/index.js` (the import path inside the `Proxy` is relative to each file's own directory), which is expected and fine.

### Step 3 — Update `docs/agents/i18n.md`

- In the "Where translations live" section, replace the description of `chunkLoaders` as "a literal, hand-written thunk per file rather than a glob" with a description of the `Proxy`-based approach: still no `import.meta.glob` (same Node/Jasmine constraint, now resolved differently), computed on demand from the namespace name via the filename convention, with real own-properties still overridable by tests.
- Add a one-line invariant note near the `chunkLoaders`/`Translator.t()` description: `Translator.t()` must never be called with a key derived from user/data input, since a namespace mapping to a nonexistent or unintended `.yaml` file now resolves through a live dynamic import rather than a bounded object lookup. (Practically unchanged risk — this has always been true — just now worth stating explicitly.)

### Step 4 — Verify chunk-splitting is preserved (manual, not covered by CI)

No CI job runs `vite build` on every PR (only the deploy release jobs do). Before merging:

```bash
docker-compose run --rm majora_fe yarn build
```

Inspect the `dist/` chunk list/manifest and confirm there is still one chunk per namespace per language (not a shared/bundled chunk covering multiple namespaces) — compare against a build from `main` if needed. Also confirm `common.yaml` isn't unexpectedly duplicated into an extra unused chunk beyond the eagerly-inlined copy (harmless if it is, but worth noting).

### Step 5 — Run the existing test/lint suite unmodified

```bash
docker-compose run --rm majora_fe npm run coverage
docker-compose run --rm majora_fe npm run check_i18n
docker-compose run --rm majora_fe npm run lint
```

`TranslationLoaderSpec.js` and `TranslatorSpec.js` should pass without any spec-file changes, confirming the `namespace in target` override seam still works exactly as before.

## Files to Change

- `frontend/assets/i18n/en/index.js` — hand-typed `chunkLoaders` object replaced with the `Proxy`.
- `frontend/assets/i18n/pt/index.js` — same replacement (file remains identical to `en/index.js`).
- `docs/agents/i18n.md` — update the manifest-shape description and add the `Translator.t()` key-invariant note.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- No CI job builds the production bundle on a PR (`vite build` only runs inside deploy-only release jobs), so the chunk-splitting verification in Step 4 must be done manually and isn't automatically enforced — flag this explicitly in the PR description so a reviewer knows it was checked by hand.
- After this change, `en/index.js` and `pt/index.js` are still byte-identical to each other (same ~6-line `Proxy` body) — this residual duplication is expected and should be well below whatever line-count threshold triggered the original 151-line Codacy clone flag, but isn't literally zero.
