# Frontend Plan: Explore generating the i18n loader manifest to remove en/pt duplication

Main plan: [plan.md](plan.md)

## Overview

Companion fix discovered during implementation of [translator.md](translator.md): once `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js` compute `chunkLoaders` via a `Proxy` (see `translator.md`, already implemented and committed), `frontend/specs/support/preloadTranslations.js`'s `Object.keys(manifest.chunkLoaders)` (line 66) no longer enumerates any page-specific namespace — a `Proxy` wrapping an initially-empty `target` object has no own enumerable keys until a namespace has actually been overridden by a spec fixture, so `Object.keys()` on it returns `[]`. Confirmed directly: `Object.keys(en.chunkLoaders).length === 0` and `'game_new_page' in en.chunkLoaders === false` under the new `Proxy`, even though `en.chunkLoaders.game_new_page()` itself still resolves the dynamic import correctly.

`preloadTranslations.js` uses that key list to warm `TranslationLoader`'s cache for every real chunk, in every language, before any spec runs (see the comment already in that file — most specs assert translated text synchronously without awaiting `TranslationLoader`). With the key list empty, only `common` gets preloaded, so any spec touching a page-specific namespace regresses to raw fallback keys (e.g. `game_poll_page.loading`) instead of translated text. This was confirmed as the root cause of 167 Jasmine spec failures in `docker-compose run --rm majora_fe npm run coverage` (0 failures on `main`/baseline).

## Context

- `TranslationLoader.js` and `Translator.js` are untouched by issue #1197 — this fix only touches spec-support tooling.
- `en/index.js`/`pt/index.js` are already updated (see `translator.md`) and out of scope here — do not re-touch them.
- This file runs under plain Node (no Vite), same constraint documented in `docs/agents/i18n.md` for the `index.js` manifests themselves.

## Implementation Steps

### Step 1 — Enumerate namespaces from the filesystem instead of `Object.keys(chunkLoaders)`

In `frontend/specs/support/preloadTranslations.js`, replace the `Object.keys(manifest.chunkLoaders)` call (currently inside `beforeAll`, building the `namespaces` array) with a filesystem-based enumeration of each language's `.yaml` namespace files, since the `Proxy` no longer exposes real keys for anything that hasn't been overridden by a spec fixture.

Use Node's `fs`/`path`/`url` (this file already runs under plain Node via the custom `jsx-loader.mjs`, same as `index.js` itself) to list every `*.yaml` file in each language's `frontend/assets/i18n/<language>/` directory, stripping the `.yaml` extension to get the namespace name, and excluding `common` (already handled separately via the `'common', ...` prefix already present in the `namespaces` array construction — keep that part unchanged, just replace the source of the rest of the list).

Example approach (adapt to match this file's existing style — arrow functions, JSDoc on any new helper):

```js
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ...

/**
 * Lists every page-specific namespace for a language by reading its i18n
 * directory directly off disk, since `manifest.chunkLoaders` is now a
 * `Proxy` with no real own keys until a namespace has been requested or
 * overridden by a spec fixture (see docs/agents/i18n.md).
 *
 * @param {string} language - The language code whose directory to list.
 * @returns {string[]} namespace names (file basenames without `.yaml`), excluding `common`.
 */
const listNamespaces = (language) => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '../../assets/i18n', language);

  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'common.yaml')
    .map((file) => file.replace(/\.yaml$/, ''));
};
```

Adjust the relative path from `preloadTranslations.js`'s actual location (`frontend/specs/support/`) to `frontend/assets/i18n/<language>/` precisely — double check with `pwd`/`ls` rather than assuming the snippet above's relative path is exact.

Then update the `beforeAll` block's `namespaces` construction to use `listNamespaces(language)` instead of `Object.keys(manifest.chunkLoaders)`.

### Step 2 — Verify the fix

```bash
docker-compose run --rm majora_fe npm run coverage
```

Confirm 0 spec failures (matching the `main`/baseline count) — this must cover every page-specific namespace exactly as `Object.keys(chunkLoaders)` did before the `Proxy` change, not just `common`. Spot-check that the namespace list from `listNamespaces('en')` matches the full `.yaml` file listing under `frontend/assets/i18n/en/` (minus `common.yaml`).

Also run:

```bash
docker-compose run --rm majora_fe npm run lint
```

to confirm no lint regressions from the new `fs`/`path`/`url` imports.

## Files to Change

- `frontend/specs/support/preloadTranslations.js` — replace `Object.keys(manifest.chunkLoaders)` with a filesystem-based namespace listing, since the `Proxy`-based `chunkLoaders` (see `translator.md`) no longer exposes real own keys for un-overridden namespaces.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`) — must return to 0 failures.
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- Do not modify `TranslationLoaderSpec.js` or `TranslatorSpec.js` — their `en.chunkLoaders[namespace] = fakeFn` fixture-injection seam is unaffected by this fix (it works today under the `Proxy` exactly as before, per `translator.md`).
- Do not re-touch `frontend/assets/i18n/en/index.js` / `pt/index.js` — those are already implemented and committed by the `translator` agent.
