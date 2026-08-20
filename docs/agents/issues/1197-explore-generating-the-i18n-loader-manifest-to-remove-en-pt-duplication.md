# Issue: Explore generating the i18n loader manifest to remove en/pt duplication

## Description

Sub-issue of #1193.

Codacy's duplication check flags `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js` as a 151-line clone pair.

## Problem

Both files are lazy `?raw` chunk-loader manifests — one `() => import('./<namespace>.yaml?raw')` entry per translation namespace, identical namespace keys across languages by design (each language must expose the same namespace set). The duplication is structurally inherent to hand-maintaining one explicit loader map per language, not a copy-paste accident, but it does mean every new namespace requires the same edit in every language's `index.js`.

## Expected Behavior

Adding a translation namespace no longer requires a matching hand-written entry in every language's loader manifest, and Codacy's duplication metric on these files drops accordingly.

## Solution

### Rejected: `import.meta.glob` per language directory

The issue's original idea — replacing each language's hand-typed `chunkLoaders` object with `import.meta.glob('./*.yaml', { query: '?raw', import: 'default' })` — runs into a documented constraint: `docs/agents/i18n.md` explicitly avoids `import.meta.glob` because the Jasmine test suite doesn't run through Vite. `frontend/specs/support/preloadTranslations.js` and `frontend/assets/js/i18n/TranslationLoader.js` both `import * as en from '.../en/index.js'` directly under plain Node, via a custom ESM loader (`frontend/specs/support/jsx-loader.mjs`) that only intercepts literal `?raw` import specifiers. `import.meta.glob` is a Vite-only compile-time macro with no Node equivalent — using it in `index.js` would throw at Jasmine-test runtime unless the custom loader is taught to emulate glob-expansion, which reintroduces exactly the tooling coupling the current hand-written manifests were chosen to avoid.

### Chosen approach: `chunkLoaders` becomes a computed `Proxy`, not a computed import path in `TranslationLoader`

An earlier draft of this approach moved the dynamic-import logic into `TranslationLoader.js#fetchRaw`, replacing `manifest.chunkLoaders[namespace]()` with a direct `import(`.../${language}/${namespace}.yaml?raw`)`. Two things rule that out:

- `Translator.js` eagerly imports the *startup* language's `common` chunk outside `TranslationLoader`'s lazy path (`INITIAL_COMMON = load(MANIFESTS[INITIAL_LANGUAGE].default)`), specifically so header/chrome elements never flash untranslated on first paint. That eager `import common from './common.yaml?raw'` must stay a literal static import inside `index.js` — it can't become a computed dynamic import, so `index.js` can't disappear entirely.
- `TranslationLoaderSpec.js` and `TranslatorSpec.js` both inject fictional, disposable namespaces by mutating `en.chunkLoaders[namespace] = fakeFn` directly, specifically so they never touch a real chunk file. Moving the import logic into `TranslationLoader.js` would remove that seam, since there'd be no `chunkLoaders` object left to override.

Instead, `chunkLoaders` stays a real, mutable object exported from each language's `index.js` — but computed via a `Proxy` instead of hand-typed per namespace:

```js
// frontend/assets/i18n/en/index.js (pt/index.js identical — the import path is relative)
import common from './common.yaml?raw';

const chunkLoaders = new Proxy({}, {
  get: (target, namespace) =>
    namespace in target ? target[namespace] : () => import(`./${namespace}.yaml?raw`),
});

export default common;
export { chunkLoaders };
```

The `namespace in target` check preserves the existing spec seam exactly: `en.chunkLoaders[namespace] = jasmine.createSpy(...)` still works, since the assignment creates a real own property that the trap then returns instead of computing a real import. Because `import(`./${namespace}.yaml?raw`)` is a plain runtime-computed dynamic import (not a Vite macro), it resolves under Node exactly like any other dynamic import — the existing `jsx-loader.mjs` `?raw` handling already covers it (it matches on the final specifier's suffix, regardless of how the specifier was built).

**In scope:** only `en/index.js` and `pt/index.js` change (140 hand-typed lines → ~6 lines of `Proxy` logic each), plus `docs/agents/i18n.md`'s description of the manifest shape.

**Explicitly unchanged:** `TranslationLoader.js`, `Translator.js`, `TranslationLoaderSpec.js`, `TranslatorSpec.js`, `preloadTranslations.js`, `check_i18n.js` — none of them need edits.

**Note:** `en/index.js` and `pt/index.js` remain identical to each other after this change (same ~6-line `Proxy` body, since the import path is relative to each file's own directory) — this residual duplication is expected and fine, well below whatever line-count threshold triggered the original 151-line clone flag.

Verification still required before merging, since this touches build tooling rather than application code:
- Confirm Vite's production build still code-splits `import(`./${namespace}.yaml?raw`)` into one chunk per namespace per language (not one shared chunk) — Vite supports template-literal dynamic imports with a single expression for this purpose, but the actual output chunk graph needs checking against today's baseline.
- Confirm lazy-loading behavior is unchanged end to end (fetched on demand via `TranslationLoader`, per `docs/agents/i18n.md`).

### Out of scope: `commonNamespaces`

`commonNamespaces` (the list of top-level namespace keys bundled inside `common.yaml`) is also identical across `en`/`pt` today, but it's data *about `common.yaml`'s content*, not a file listing, so it can't be derived the same way as `chunkLoaders`. Deriving it (e.g. parsing `common`'s raw YAML at load time and taking its top-level keys) is a plausible follow-up but isn't part of this issue.

## Performance & Security

**Performance:**

- The `Proxy` trap's overhead is negligible — `TranslationLoader.request()` already dedupes per `(language, namespace)` pair, so the trap fires at most once per pair per session, same call frequency as today's plain object lookup.
- The real risk is chunk-splitting fidelity, not raw overhead: if Vite's variable-dynamic-import bundling doesn't split one chunk per matched `.yaml` file the way today's literal `import('./x.yaml?raw')` calls do — e.g. if it bundles multiple namespaces into one shared chunk instead — that silently defeats lazy loading (unrelated namespaces would start loading together), a functional regression dressed as a performance one. Needs an actual build-output check (inspect the `dist/` chunk list before/after), not just a behavioral smoke test.
- The `Proxy`'s pattern (`./${namespace}.yaml?raw`) structurally also matches `common.yaml`, even though nothing ever calls `chunkLoaders['common']` (that path always goes through the eager static import instead). Vite may register `common.yaml` as a second, unused dynamic-import chunk candidate alongside the eagerly-inlined copy — harmless at runtime (never fetched) but worth a quick look at build output to confirm it isn't duplicating real bytes unnecessarily.

**Security:**

- `namespace` values reaching this dynamic import always originate from literal translation keys hardcoded at `t()` call sites in component source, never user input (per `docs/agents/i18n.md`: only static, developer-authored text goes through `t()`), so there's no realistic attacker-controlled-path risk in practice.
- Still worth naming as an explicit invariant rather than leaving it implicit: swapping a bounded object lookup (`chunkLoaders[namespace]`, today) for a live dynamic import computed from `namespace` (this change) means the safety of the whole thing depends on that invariant holding — `Translator.t()` must never be called with a key derived from user/data input. That was already true before; the failure mode of violating it gets slightly worse (open-ended dynamic import vs. a bounded lookup returning `undefined`). Add a one-line note to this effect in `docs/agents/i18n.md`.
- Production builds aren't an open filesystem-read surface either way — Vite's variable-dynamic-import resolution only registers files actually matching the pattern at build time as valid targets, the same closed-set guarantee `import.meta.glob` would have given.

## Benefits

Removes hand-maintained duplication that scales with the number of languages × namespaces, and makes adding a new language or namespace a smaller, less error-prone change — while avoiding new coupling between the Vite build and the Node-based Jasmine test loader.
