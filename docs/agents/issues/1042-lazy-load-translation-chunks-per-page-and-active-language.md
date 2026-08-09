# Issue: Lazy-load translation chunks per page and active language

## Description

Split off from #1041 (translation file splitting). That issue splits each locale's translations into `assets/i18n/<lang>/common.yaml` + one file per page namespace, but keeps runtime loading behavior unchanged (`Translator.js` still eager-loads everything). This issue is the follow-up that actually changes runtime loading, and depends on #1041 landing first — it needs the per-namespace file layout to exist before there's anything to lazy-load individually.

## Problem

Today `Translator.js` eagerly imports *every* language's *entire* translation set at module load, regardless of which language is active or which pages are ever visited — spending browser memory and bandwidth on translations that may never be used in a given session.

## Expected Behavior

- Only the **active language**'s `common` chunk (shared namespaces: `header`, modals, `pagination`, etc.) loads eagerly on startup.
- Each **page's own namespace** chunk loads lazily, on demand, as that page is visited.
- Switching languages loads the newly-selected language's currently-needed chunks instead of relying on everything already being resident in memory.

### Flow

1. **Trigger**: any `Translator.t('<page_namespace>.some_key')` call for a namespace not yet loaded for the current language triggers a background load implicitly — there is no explicit per-page call. The namespace is derived from the key's first dot-segment; on a cache miss, a dedicated `TranslationLoader` kicks off a dynamic `import('../i18n/<lang>/<page_namespace>.yaml?raw')` for that `(language, namespace)` pair.
2. **While loading**: `t()` calls made before the import resolves return the fallback/key — the same fallback path already used today for a missing/typo'd key. No crash, no blocking render, and **no call-site changes** anywhere: not across the ~97 namespaces' worth of `t()` call sites, and not at page mount points either, since components already call `t()` for their own strings and that alone is enough to trigger loading.
3. **On resolve**: `TranslationLoader` always stores the parsed chunk and marks that `(language, namespace)` entry as loaded, regardless of whether that language is still active. It emits a load event only if the loaded language is still `Translator.getLanguage()` at that moment — a load for a language the user has since switched away from is cached silently, with no remount.
4. **Remount**: `App.jsx`'s existing remount-by-`key` listener reacts to two distinct signals: `language:changed` (fired synchronously by `setLanguage()`, unchanged from today — signals the language identity changed) and a new sibling event emitted by `TranslationLoader` on a live resolve (signals a chunk became available). The remount key incorporates both (e.g. hash, language, and a counter bumped by the new event).
5. **Cache**: `TranslationLoader` entries are permanent for the session — never deleted or aborted, even across language switches. This matters because dynamic `import()` cannot be cancelled at the network level, so a chunk that started loading before a language switch keeps loading in the background regardless; letting it finish and cache silently (rather than tearing it down) avoids a duplicate fetch if the user swaps back to that language before it resolves.
6. **Language switch**: `Translator.setLanguage(newLang)` only switches the active language pointer, persists it, and fires `language:changed` immediately (fallback text shows for anything not yet cached in the new language) — it contains no explicit "reload currently-needed chunks" logic. The resulting remount causes currently-visible components to call `t()` again, which naturally re-triggers loads for whatever the new language needs through the same on-miss path in `TranslationLoader`. Revisiting a language already fully loaded this session is instant, cache hits included.

## Solution

### Scope

- New `TranslationLoader` class (dedicated, separate from `Translator` — small single-responsibility classes, mirroring the project's existing `LanguageStorage`/`LanguageEvents`/`AuthEvents` style): owns a map keyed by `(language, namespace)` to `{ state: 'loading' | 'loaded' | 'failed', data }`. `request(language, namespace)` starts a dynamic import if no entry exists yet for that key (dedupes concurrent/duplicate requests); on resolve, always stores the parsed data and flips the entry to `loaded`, emitting the load event only if that language is still the active one at that moment. `get(language, namespace)` returns cached data or `undefined`.
- New sibling event mechanism (e.g. `TranslationEvents.js` mirroring `LanguageEvents.js`) emitted by `TranslationLoader` on a live resolve — kept distinct from `language:changed` rather than reusing it, since reusing it (re-emitting the same language string) wouldn't trigger a React remount for the "namespace arrived, language unchanged" case.
- `Translator.t(key, fallback)`: derive `namespace = key.split('.')[0]`, look it up via `TranslationLoader.get(currentLanguage, namespace)`; on a hit, resolve the key within it; on a miss, fire `TranslationLoader.request(currentLanguage, namespace)` (fire-and-forget) and return the fallback. The `common` chunk for the language active at startup stays eagerly bundled/imported at module load (not lazy), to avoid a flash on chrome elements like the header; every other namespace — including `common` for any language switched into later — goes through the lazy `TranslationLoader` path.
- Namespace → chunk-file lookup: most namespaces map 1:1 to a chunk file of the same name, but `common.yaml` bundles several namespace keys (`header`, `login_modal`, `pagination`, `description_box`, `markdown_editor`, `language_selector`, …) into one chunk. Each language's `index.js` manifest gains a small hand-maintained `commonNamespaces` list (the namespace keys bundled inside that language's `common.yaml`); `TranslationLoader` checks a namespace against that list first — a hit resolves to the `common` chunk, a miss falls back to the existing 1:1 convention. This keeps the lookup a plain hand-authored data structure, consistent with the project's manifest-authoring style, and avoids touching `check_i18n` (out of scope per #1041).
- `Translator.setLanguage()`: simplified to switching the language pointer, persisting it, and emitting `language:changed` — no reload-current-namespaces logic needed (see Flow step 6).
- `App.jsx`/`AppController`: subscribe to both `language:changed` and the new `TranslationLoader` load event; extend the remount key to include a version/counter bumped by the new event, alongside the existing hash/language.
- `docs/agents/i18n.md`: document `TranslationLoader`, the implicit load-on-`t()`-miss convention (there is no mount-time `loadNamespace` call to document), the fallback-then-remount timing, and the permanent-cache/no-abort behavior across language switches.
- Test-side accommodation: Jasmine specs run under the project's Node-based loader (the reason the `?raw` manifest pattern exists instead of `import.meta.glob`, per `docs/agents/i18n.md`), and a component under test calling `t()` will now trigger a real dynamic `import()` through `TranslationLoader` instead of reading an already-fully-loaded in-memory map. In scope: a way for specs to either pre-seed `TranslationLoader`'s cache so components render translated text synchronously, or await its pending loads before asserting — whichever fits the existing spec-helper conventions best. Left to implementation to work out case-by-case which shape reads best against the current spec suite.

### Race conditions

Walked through against the `TranslationLoader` design above; no open issues, but these constraints need to be explicit in the implementation rather than left as emergent behavior:

- **Synchronous dedupe**: `TranslationLoader.request()` must check-and-mark an entry `loading` synchronously, before calling `import()`. Since JS has no preemption, this makes the check-then-set atomic relative to any other synchronous `t()` call in the same render pass — two components racing to request the same namespace in one render can't both fire an `import()`. The same "never delete, dedupe on existing entries regardless of state" rule also closes rapid A→B→A→B language-swap duplication for free — whichever swap first touches a given `(language, namespace)` pair is the only one that fetches it.
- **Liveness check correctness**: on resolve, the "is this language still active" comparison must be `entry.language === Translator.getLanguage()` — the entry's own *captured* request-time language compared against the current one — not something re-derived later. This comparison is inherently race-free (nothing can interleave between a promise's `.then()` firing and the synchronous check inside it), but only if the entry stores the language it was requested for.
- **Remount counter must use a functional state update** (`setVersion(v => v + 1)`, not `setVersion(version + 1)`), since a page with several nested namespaces can have multiple load events land in the same React batch; a non-functional update would silently lose increments to stale-closure overwrites.
- **`TranslationLoader`'s map must be a plain module-level singleton**, independent of component lifecycle (no `useEffect` cleanup tied to it) — the same shape as `Translator`/`LanguageStorage`/`LanguageEvents` today. The mechanism depends on loader state surviving the very remounts it triggers.

### Failed import handling

A rejected dynamic `import()` (stale chunk URL after a deploy, network blip) needs its own state, since the design above only has `loading`/`loaded`:

- On rejection, `TranslationLoader` catches it and flips that `(language, namespace)` entry to a third state, `failed` — kept permanently in the map (same "never delete" rule as everything else), no automatic retry. `t()` treats `failed` exactly like "not yet loaded": returns the fallback, no crash, no remount event fired (there's nothing new to render).
- No retry/backoff logic. The most likely real-world cause is a stale deployed chunk URL after a new release (chunk filenames are content-hashed, so an old client can reference a hash the server no longer has) — a page reload is the actual fix for that, not a retry loop. The project's existing `GenericClient` doesn't retry failed requests either.
- Only lazily-thunked chunks can hit this path at all. The startup-active language's `common` chunk stays a genuine static `import` (bundled into the main entry chunk, like today), so it has no separate-network-request failure mode.
- Visibility: this surfaced a gap (the frontend has no `console.error`/`console.warn` convention anywhere) that's broader than this issue, so it was split off into #1045 (add a console logger utility for the frontend). `TranslationLoader` is expected to be its first consumer, logging a warning when a chunk load fails, but the logger itself is out of scope here.

### Explicitly decided

- `Translator.t()` stays a **synchronous** API — no call sites across the codebase change. Async/await or subscription-based lookup was considered and rejected as much larger blast radius for no clear benefit over the fallback+remount pattern, which already exists for the language-switch case.
- No explicit `loadNamespace()` call convention at Helper/Controller mount points either. `t()` itself triggers loading implicitly on a cache miss (via `TranslationLoader`), so there are truly zero call-site changes anywhere in the codebase — not even at page mount points.
- Two distinct events, not one reused event, drive the remount: `language:changed` keeps signaling only "the language identity changed" (fired synchronously by `setLanguage()`, unchanged payload); a new sibling event on `TranslationLoader` signals "a chunk finished loading." Reusing `language:changed` alone for the latter was rejected because re-emitting the same language string doesn't trigger a React remount (state setter bails out on an identical primitive).
- `TranslationLoader` entries are never deleted or aborted. Dynamic `import()` cannot be cancelled at the network level, so a chunk that started loading before a language switch keeps loading regardless; every `(language, namespace)` pair is fetched at most once per session and stays cached even if the user switches away mid-load or after.
- `setLanguage()` itself contains no explicit "reload currently-needed chunks for the new language" logic. That reload happens for free via the existing remount → re-render → `t()` re-call cycle hitting `TranslationLoader`'s on-miss path — the same mechanism used for a fresh page's namespace load.
- `common.yaml`'s bundled namespace keys resolve to the `common` chunk via a hand-maintained `commonNamespaces` list on each language's `index.js` manifest, not a build-time-generated mapping. Generating it via `check_i18n` was considered and rejected as out of scope (that script's changes belong to #1041) and unnecessary given how rarely a new shared namespace is added to `common.yaml`.

### Out of scope (covered by #1041 instead)

- Splitting the YAML files themselves into `common.yaml` + per-namespace files.
- `check_i18n` script changes for validating the split file layout.
- The "Where translations live" / "Adding a new language" doc updates for the new file layout.

### Out of scope (covered by #1045 instead)

- The console logger utility itself. #1042 only needs `TranslationLoader` to mark a failed chunk load and degrade gracefully (see "Failed import handling"); wiring an actual `console.warn`/`console.error` call through a dedicated logger is #1045's job. Until #1045 lands, a failed load is simply silent (fallback text, no log output) — acceptable since it's already a rare, non-blocking failure mode.

## Benefits

- Reduces browser memory and bandwidth: a session only ever pays for the language(s) and page namespaces actually visited, instead of every language's entire translation set upfront.
- No call-site changes anywhere in the codebase — not the ~97 namespaces' worth of `t()` calls, and not page mount points either — since loading is triggered implicitly by `t()` itself.
- Language switching stays responsive: chunks already loaded this session (for any language) are cached permanently and never re-fetched, so revisiting a language is instant after the first visit.
