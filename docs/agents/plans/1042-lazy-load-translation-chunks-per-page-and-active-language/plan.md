# Plan: Lazy-load translation chunks per page and active language

Issue: [1042-lazy-load-translation-chunks-per-page-and-active-language.md](../../issues/1042-lazy-load-translation-chunks-per-page-and-active-language.md)

## Overview

Replace `Translator.js`'s eager "import every language's entire translation set at module load" behavior with a dedicated `TranslationLoader` class that lazily loads each `(language, namespace)` chunk on first use, triggered implicitly by `t()` itself. Only the startup-active language's `common` chunk stays eager. This is entirely frontend work — one specialist agent, no split needed.

## Context

Split off from #1041, which already landed the per-namespace YAML file layout (`frontend/assets/i18n/<lang>/common.yaml` + one file per page namespace, plus a hand-maintained `index.js` manifest per language). #1041 kept runtime loading unchanged — `Translator.js` still eager-imports every chunk of every language at module load via each language's `index.js`. This plan implements the runtime change: lazy per-namespace loading, driven implicitly by `t()`, with a permanent in-memory cache and no call-site changes anywhere in the codebase.

## Implementation Steps

### Step 1 — Add `TranslationLoader`

New file `frontend/assets/js/i18n/TranslationLoader.js`, a plain module-level singleton (not tied to component lifecycle) mirroring the project's existing small single-responsibility i18n classes (`LanguageStorage.js`, `LanguageEvents.js`).

Owns a map keyed by `` `${language}:${namespace}` `` to `{ language, namespace, state, data }`, where `state` is `'loading' | 'loaded' | 'failed'`.

- `request(language, namespace)`: if an entry already exists for that key (any state), no-op — this is the dedupe. Otherwise, synchronously create the entry with `state: 'loading'` *before* calling the loader (see "synchronous dedupe" note below), resolve which chunk file to `import()` (see Step 3's namespace → chunk lookup), and kick off the dynamic import. On resolve: parse with `js-yaml`'s `load()`, store the parsed data, flip `state` to `'loaded'`, and emit `TranslationEvents.emit()` (Step 2) only if `language === Translator.getLanguage()` at that moment. On rejection: flip `state` to `'failed'`, store no data, do not emit (there's nothing new to render). Entries are never deleted, in any state.
- `get(language, namespace)`: returns the entry's `data` when `state === 'loaded'`, else `undefined`.

Must be synchronous check-then-set (no `await` before marking `loading`) so two `t()` calls racing to request the same namespace in the same render pass can't both fire a duplicate `import()`.

### Step 2 — Add `TranslationEvents`

New file `frontend/assets/js/i18n/TranslationEvents.js`, structured identically to `frontend/assets/js/i18n/LanguageEvents.js` (a `window`-level `CustomEvent`, `emit`/`subscribe`/`unsubscribe` static methods, no-op guards for `typeof window === 'undefined'`). Use a distinct event name (e.g. `i18n:namespace-loaded`) — this is deliberately a separate event from `language:changed`, not a reuse of it, since re-emitting `language:changed` with an unchanged language string wouldn't trigger a React remount (state setter bails out on an identical primitive).

### Step 3 — Convert language manifests to lazy thunks + `commonNamespaces`

Rewrite `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js` (currently identical in structure — 71 page-specific `.yaml` files each statically `?raw`-imported, plus `common.yaml`, enforced by `check_i18n`). New shape per language:

- `common` stays a genuine static `?raw` import (unchanged from today), default-exported as `common` — this is what `Translator.js` eager-loads at module init for the active language only.
- Every other namespace file becomes a lazy thunk instead of a static import: `<name>: () => import('./<name>.yaml?raw')`, exported as a named map (e.g. `chunkLoaders`). This is a mechanical rewrite of every entry in both files.
- Add a `commonNamespaces` export: the list of top-level YAML keys bundled inside that language's `common.yaml` (currently: `header`, `view_as_modal`, `login_modal`, `file_upload_modal`, `photo_upload_modal`, `photo_view_modal`, `photo_card`, `profile_photo_set_modal`, `clear_cache_confirm_modal`, `delete_photo_confirm_modal`, `slain_confirm_modal`, `back_button`, `pagination`, `description_box`, `markdown_editor`, `character_page`, `character_status_badges`, `character_preview_section`, `language_selector`, `treasure_exchange_modal`, `item_exchange_modal`, `give_item_modal`, `give_treasure_modal`, `give_document_modal`, `document_exchange_modal`, `game_treasures_page`, `errors` — verify against `common.yaml`'s actual top-level keys at implementation time, and keep this list updated whenever a namespace is added to/removed from `common.yaml`). Identical for `en` and `pt`, same as the rest of the manifest's file layout.

`check_i18n.js` reads `.yaml` files directly off disk (`frontend/scripts/check_i18n.js`'s `listChunkFiles`/`loadLanguage`), not through `index.js` — confirmed this rewrite doesn't interact with it at all, consistent with the issue's decision to leave `check_i18n` out of scope.

### Step 4 — Rewire `Translator.js`

- Module init: eager-merge only the *active* language's `common` chunk (via `LanguageStorage.getLanguage()`/`DEFAULT_LANGUAGE`, same resolution as today) into the initial in-memory map. Do not import the other language's `index.js` eagerly, and do not merge any non-`common` chunk at module init.
- `t(key, fallback)`: derive `namespace = key.split('.')[0]`. Check `commonNamespaces` for the current language first — a hit resolves to the `common` chunk (already in memory if it's the active-at-startup language, or fetched lazily via `TranslationLoader` otherwise); a miss falls back to `namespace` as the chunk name. Look up `TranslationLoader.get(currentLanguage, chunkName)`; on a hit, resolve `key` within the merged map (same dot-path `#lookup` as today); on a miss, fire `TranslationLoader.request(currentLanguage, chunkName)` (fire-and-forget) and return the fallback, exactly like today's missing-key path.
- `setLanguage(language)`: unchanged in shape — switch `#language`, persist via `LanguageStorage`, emit `LanguageEvents.emit(language)` — but drop any assumption that the new language's data is already resident. No explicit "reload currently-needed chunks" call here; the resulting remount (Step 5) causes visible components to call `t()` again, which naturally re-triggers loads for whatever the new language needs through `TranslationLoader`.

### Step 5 — Remount wiring in `App.jsx` / `AppController.js` / `AppHelper.jsx`

- `AppController.js`: alongside the existing `LanguageEvents.subscribe(handleLanguageChange)`, subscribe to `TranslationEvents` too. Add a new state setter parameter (e.g. `setLoadVersion`) invoked on each `TranslationEvents` firing, using a functional update (`setLoadVersion((v) => v + 1)`) — not `setLoadVersion(loadVersion + 1)` — since several nested namespaces on one page can have load events land in the same React batch, and a non-functional update would silently lose increments to stale-closure overwrites. Unsubscribe both listeners in the effect cleanup.
- `App.jsx` (`components/App.jsx`): add the `loadVersion` state (`useState(0)`), wire it into the `AppController` constructor, and pass it through to `controller.renderPage(...)`.
- `AppHelper.jsx`: extend the remount `key` from `` `${hash}:${lang}` `` to also incorporate `loadVersion`, e.g. `` `${hash}:${lang}:${loadVersion}` ``.

### Step 6 — Update specs

- `frontend/specs/assets/js/i18n/TranslatorSpec.js`: existing specs for `header.login` (lives in `common`, eager for `en`, the default) should keep passing unchanged. Add coverage for the lazy path: a page-specific-namespace key misses on first call (returns fallback) and resolves after the underlying `import()` settles (await one or more microtask ticks, or a small spec helper that awaits `TranslationLoader`'s pending entry directly).
- New `frontend/specs/assets/js/i18n/TranslationLoaderSpec.js`: dedupe (two `request()` calls for the same key only trigger one `import()`), permanent caching (a `loaded` entry is never cleared, including across a simulated language switch), the `failed` state on a rejected import, and the "no event when the language is no longer active at resolve time" rule.
- New `frontend/specs/assets/js/i18n/TranslationEventsSpec.js`: mirror `frontend/specs/assets/js/i18n/LanguageEventsSpec.js`'s shape (emit/subscribe/unsubscribe, no-op guards).
- `frontend/specs/assets/js/components/AppControllerSpec.js`: extend the existing `'updates lang on language:changed and unsubscribes on cleanup'` pattern with an equivalent case for the new `TranslationEvents` subscription driving `setLoadVersion`.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js` / `frontend/specs/assets/js/AppSpec.js`: check whether the remount-key change needs any assertion updates; update if so.
- Node/Jasmine environment note: `frontend/specs/support/jsx-loader.mjs` already resolves both static and dynamic `?raw` imports (its `resolve`/`load` hooks apply to any `import()` call, not just static ones), so `TranslationLoader`'s dynamic imports work in specs without additional mocking — the only accommodation specs need is awaiting the async resolution before asserting on translated text, not mocking the import mechanism itself.

### Step 7 — Update docs

`docs/agents/i18n.md`: document `TranslationLoader` and `TranslationEvents`, the implicit load-on-`t()`-miss convention (no mount-time call to document), the `commonNamespaces` manifest addition, the fallback-then-remount timing for the lazy path (extending the existing "Using `Translator.t()` in components" section), and the permanent-cache/no-abort behavior across language switches (extending "Language selector and persistence").

## Files to Change

- `frontend/assets/js/i18n/TranslationLoader.js` — new
- `frontend/assets/js/i18n/TranslationEvents.js` — new
- `frontend/assets/js/i18n/Translator.js` — lazy `t()`, simplified `setLanguage()`, active-language-only eager `common`
- `frontend/assets/i18n/en/index.js` — lazy thunks + `commonNamespaces`
- `frontend/assets/i18n/pt/index.js` — lazy thunks + `commonNamespaces`
- `frontend/assets/js/components/AppController.js` — subscribe to `TranslationEvents`, bump `loadVersion`
- `frontend/assets/js/components/App.jsx` — add `loadVersion` state
- `frontend/assets/js/components/helpers/AppHelper.jsx` — extend remount `key`
- `frontend/specs/assets/js/i18n/TranslatorSpec.js` — lazy-path coverage
- `frontend/specs/assets/js/i18n/TranslationLoaderSpec.js` — new
- `frontend/specs/assets/js/i18n/TranslationEventsSpec.js` — new
- `frontend/specs/assets/js/components/AppControllerSpec.js` — new-event subscription coverage
- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js` — update if remount-key coverage needs it
- `frontend/specs/assets/js/AppSpec.js` — update if needed
- `docs/agents/i18n.md` — document the new mechanism

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (or `yarn coverage`) (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`) — expected to pass unchanged, since it reads `.yaml` files directly off disk and never touches `index.js`

## Notes

- Console logging for a `failed` chunk load is intentionally not part of this plan — split off into #1045 (add a console logger utility for the frontend). Until that lands, a failed load is silent (fallback text only), matching the issue's explicit scope boundary.
- `commonNamespaces`' exact list must be verified against `common.yaml`'s current top-level keys at implementation time (listed in Step 3 as of this plan's writing) — it's hand-maintained, not derived, so it can drift if a shared namespace is added to `common.yaml` without updating it.
- Single-agent plan (frontend only) — this issue doesn't touch translation *content* or `check_i18n` (that's the `translator` agent's territory), only the runtime loading mechanism and the manifest files' internal structure.
