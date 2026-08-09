# Plan: Reorganize translations

Issue: [1041-reorganize-translations.md](../issues/1041-reorganize-translations.md)

## Overview

Split each locale's translation file under `frontend/assets/i18n/` from one monolithic YAML per language (~816 lines / ~28K, `en.yaml`/`pt.yaml`) into a per-language directory of smaller, per-namespace files. This is purely a maintainability/file-layout change to shrink what the `translator` agent reads and writes per edit — runtime behavior stays functionally identical (`Translator.js` still eagerly loads and merges every chunk for every language at module load; no lazy-loading, no `t()` call-site changes). The runtime lazy-loading improvement is tracked separately in follow-up issue #1042, which depends on the file layout landing here first.

## Context

The whole work item is entirely within the `translator` agent's documented scope (`frontend/assets/i18n/*.yaml`, `frontend/scripts/check_i18n.js`, and the drop-in-a-new-language process). No other specialist agent has work here: no page/component `t()` call sites change, no CSS/routing/build-config changes beyond `Translator.js` itself. Hence a single, unsplit plan.

## Implementation Steps

### Step 1 — Design the file split

For each of the ~97 top-level namespaces currently in `en.yaml`/`pt.yaml` (list them via `grep -n "^[a-zA-Z_]" frontend/assets/i18n/en.yaml`), classify it as:
- **Shared/common** — namespaces used by more than one page, or by cross-page reusable elements: `header`, `pagination`, `description_box`, `markdown_editor`, `language_selector`, `back_button`, `photo_card`, and the various modals (`login_modal`, `file_upload_modal`, `photo_upload_modal`, `photo_view_modal`, `profile_photo_set_modal`, `clear_cache_confirm_modal`, `delete_photo_confirm_modal`, `slain_confirm_modal`, `treasure_exchange_modal`, `item_exchange_modal`, `give_item_modal`, `give_treasure_modal`, `give_document_modal`, `document_exchange_modal`, `view_as_modal`) → goes into `common.yaml`.
- **Page-specific** — namespaces tied to exactly one page component (e.g. `game_new_page`, `treasure_edit_page`, `staff_dashboard`, `character_page`, `character_info`, `character_status_badges`, etc.) → gets its own file named after the namespace, e.g. `game_new_page.yaml`.

Verify each classification against actual usage (`grep -rn "Translator.t('<namespace>\." frontend/assets/js`) rather than guessing from the name alone — a namespace that looks page-specific but is actually consumed from more than one page's component tree belongs in `common.yaml`.

### Step 2 — Create the new directory structure and move content

Create `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`. For each namespace decided in Step 1, move its top-level key (and full nested content) out of the old single `en.yaml`/`pt.yaml` into the right new file — `common.yaml` for shared namespaces, `<namespace>.yaml` for page-specific ones. Each split file keeps its namespace(s) as explicit top-level YAML keys inside it (not inferred from the filename) — required for `common.yaml`, which bundles several namespaces together, and kept consistent for the single-namespace files too. Delete the old `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` once every key has been moved out.

### Step 3 — Add per-language chunk manifests

Vite bundles bundle-time imports statically, so each language directory needs one small manifest file enumerating its chunks — avoids introducing `import.meta.glob` (which the Node-based Jasmine test loader, `frontend/specs/support/jsx-loader.mjs`, has no equivalent for; it only shims `?raw` and `import.meta.env`, not compile-time glob macros) and keeps to the project's existing "small custom utilities, no heavy tooling" style (see `docs/agents/i18n.md`'s stated philosophy).

Add `frontend/assets/i18n/en/index.js`:
```js
import common from './common.yaml?raw';
import gameNewPage from './game_new_page.yaml?raw';
// ...one import per file in this directory, alphabetical

export default {
  common,
  game_new_page: gameNewPage,
  // ...
};
```
Mirror the same file list and shape in `frontend/assets/i18n/pt/index.js`. Adding a new namespace later means creating its `.yaml` file in both language directories and adding one matching import/export line to both `index.js` files — a small, one-time cost when a namespace is *added*, not on routine string edits (the primary problem this issue solves).

### Step 4 — Update `Translator.js`

Replace the two hardcoded imports:
```js
import enYaml from '../../i18n/en.yaml?raw';
import ptYaml from '../../i18n/pt.yaml?raw';
```
with the per-language manifests from Step 3, and merge each language's chunk contents into one flat namespace map before assigning to `TRANSLATIONS`:
```js
import { load } from 'js-yaml';
import enChunks from '../../i18n/en/index.js';
import ptChunks from '../../i18n/pt/index.js';

const mergeChunks = (chunks) =>
  Object.values(chunks).reduce((merged, raw) => Object.assign(merged, load(raw)), {});

const TRANSLATIONS = {
  en: mergeChunks(enChunks),
  pt: mergeChunks(ptChunks),
};
```
`Translator.t()`'s dot-path lookup and fallback behavior are completely unchanged — only how `TRANSLATIONS` gets built changes. Update the class doc comment: adding a new language now means adding a new `<code>/` directory (with its own `index.js`) mirroring `en/`'s file set, not a single `<code>.yaml` file.

### Step 5 — Rewrite `check_i18n.js`

Rework `frontend/scripts/check_i18n.js` (currently: list `*.yaml` files directly under `assets/i18n/`, flatten each, diff against the first as reference) to:
1. Discover per-language subdirectories under `assets/i18n/` (`en/`, `pt/`, ...) instead of listing `*.yaml` files directly.
2. For each language, read every `*.yaml` file in its directory (skip `index.js`), track which file each top-level namespace key came from, and merge them into one combined map — fail loudly if the same namespace key appears in more than one file for the same language (duplicate-namespace check; impossible within a single YAML file today, but a real risk once split).
3. Flatten each language's combined map to dotted-path keys and diff across languages exactly as today, reusing the existing `flattenKeys`/`reportDifferences` logic.
4. Additionally build a `{namespace: filename}` map per language and diff those across languages — reporting when a namespace lives in a different file for one language than another, and when a namespace file exists for one language but is entirely missing for another (call these out explicitly by filename, not just as a wall of missing keys).
5. Keep the same pass/fail console output style and exit codes as today, extended with the new failure messages.

### Step 6 — Update documentation

- `docs/agents/i18n.md`:
  - "Where translations live" — replace the single-file example with the new directory-of-files-plus-manifest layout, including the `index.js` role.
  - "Adding a new language" — step 1 becomes "add a new `<code>/` directory mirroring `en/`'s exact file set, plus its own `index.js` manifest" instead of a single new `<code>.yaml` file; step 2's code sample changes from importing one YAML file to importing the language's `index.js` manifest.
- `.claude/agents/translator.md`:
  - Scope bullet: `frontend/assets/i18n/*.yaml` → `frontend/assets/i18n/<lang>/*.yaml` (+ `index.js`).
  - Development cycle step 1: find the right namespace file inside the right language directory; when adding a *new* namespace, create the same-named file in every language directory **and** add the matching import/export line to every language's `index.js`.
  - Note the new `check_i18n` failure modes (missing file for a language, namespace duplicated across files within a language, namespace living under a different filename per language) so future runs recognize and act on them correctly.

### Step 7 — Verify

Run `yarn check_i18n` (via `docker-compose run --rm majora_fe yarn check_i18n`) and confirm it passes against the new layout. Run `yarn lint` and the Jasmine suite (`yarn test`) — in particular `frontend/specs/assets/js/i18n/TranslatorSpec.js`, which asserts real content (`Translator.t('header.login')` must still resolve to `'Login'`) against the real merged translation map, so it directly exercises the new loading path end to end.

## Files to Change

- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml` — deleted
- `frontend/assets/i18n/en/common.yaml`, `frontend/assets/i18n/pt/common.yaml` — new, shared namespaces
- `frontend/assets/i18n/en/<namespace>.yaml`, `frontend/assets/i18n/pt/<namespace>.yaml` — new, one pair per page-specific namespace (exact count depends on Step 1's classification)
- `frontend/assets/i18n/en/index.js`, `frontend/assets/i18n/pt/index.js` — new, per-language chunk manifests
- `frontend/assets/js/i18n/Translator.js` — manifest-based loading + per-language chunk merge
- `frontend/scripts/check_i18n.js` — directory discovery, per-file namespace tracking, mapping-consistency and duplicate-namespace checks
- `docs/agents/i18n.md` — updated layout description, manifest role, and "Adding a new language" steps
- `.claude/agents/translator.md` — updated scope path and development cycle guidance

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`, step "Check translations")
- `frontend`: `npm run lint` (CI job: `frontend-checks`, step "Check JS Lint")

## Notes

- The `index.js` manifests are a second source of truth that must stay in sync with each directory's actual `.yaml` files — `check_i18n.js` (Step 5) validates key/namespace consistency directly from the YAML files on disk, but does not verify that a manifest actually lists every file present. A forgotten manifest entry would silently drop a namespace from the runtime app while `check_i18n` still passes. Acceptable for this issue given the low frequency of adding new namespaces; worth a follow-up guard later if this bites in practice.
- `import.meta.glob` was considered as an alternative to the manifest files (would auto-discover chunk files with no manifest to maintain) but rejected: it has no equivalent in the Node-based Jasmine test loader (`jsx-loader.mjs`), and would require hand-rolling a Node ESM loader shim for a Vite-only compile-time macro — more risk and complexity than the explicit manifest for a rarely-changing file list.
- Runtime behavior (bundle size, load timing) is unchanged by design in this issue — `Translator.js` still eagerly loads and merges every file for every language at module load. Follow-up issue #1042 introduces lazy per-page, per-active-language loading on top of this file layout.
- The exact common-vs-page-specific classification for all ~97 namespaces is left to implementation (Step 1) rather than fixed here, since it should be verified against actual `t()` usage rather than guessed from namespace names alone.
