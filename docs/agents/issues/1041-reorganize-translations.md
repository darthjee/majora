# Issue: Reorganize translations

## Description

Translation files under `frontend/assets/i18n/` (`en.yaml`, `pt.yaml`) have grown to ~816 lines / ~28K each, each a single monolithic per-language file. This issue splits those files into smaller, per-namespace pieces to reduce the `translator` agent's read/write footprint for small changes.

This work has been split in two:

1. **This issue (#1041)** — split the translation source files on disk to reduce `translator` agent token usage. Purely a file-layout change; runtime loading behavior is unchanged.
2. **Follow-up issue #1042** — lazy-load translation chunks at runtime (active language + visited page only) to cut browser memory/bandwidth. Depends on this issue's file layout landing first.

Options originally considered:
- split and compile them during build time to serve as a single file (rejected — doesn't meaningfully shrink what the agent reads/writes per edit, and doesn't help runtime bandwidth either)
- split them and serve them on demand, per page (adopted, refined into #1042's lazy-loading design, built on top of this issue's file split)

## Problem

The `translator` agent must read and rewrite an entire 816-line locale file for even a one-line string change, burning tokens disproportionate to the actual edit.

## Expected Behavior

- Each locale's translations live under a per-language directory instead of one file: `assets/i18n/en/`, `assets/i18n/pt/`.
- Each directory holds a `common.yaml` (shared, app-wide namespaces: `header`, modals, `pagination`, `description_box`, `markdown_editor`, `language_selector`, etc.) plus one file per page-specific namespace, mirroring the existing namespace-per-component layout described in `docs/agents/i18n.md`.
- Each split file keeps its namespace(s) as explicit top-level YAML keys inside it (not inferred from filename) — needed since `common.yaml` bundles multiple namespaces together.
- Runtime behavior is functionally identical to today: `Translator.js` still eagerly loads and merges every file for every language at startup — no lazy-loading in this issue (that's #1042).
- `check_i18n` validates the new layout (see Solution below), and docs/tooling are updated to match.

## Solution

- **File split**: break each locale's single YAML into `common.yaml` + one file per page namespace, per language directory.
- **`check_i18n` rewrite** (`frontend/scripts/check_i18n.js`):
  1. Discover per-language directories under `assets/i18n/` instead of listing `*.yaml` files directly.
  2. Merge each language's chunk files into one combined map before flattening to dotted-path keys — mirrors what the runtime loader does, just eagerly/synchronously for the check.
  3. Diff combined key sets across languages, same algorithm as today, once merged.
  4. New checks the split introduces, that must fail loudly:
     - A namespace file present for one language but entirely missing for another (e.g. `pt/game_new_page.yaml` doesn't exist) — call this out explicitly as a missing file, not just a wall of missing keys.
     - The same namespace key living in a different file across languages (e.g. `header:` inside `common.yaml` for `en` but inside its own `header.yaml` for `pt`) — same keys, but would break the lazy-loading planned in #1042, which assumes an identical namespace→file mapping across languages. Needs an explicit mapping check, since pure key-diffing wouldn't catch it.
     - The same namespace key defined in more than one file for the same language (e.g. `header:` accidentally duplicated across both `common.yaml` and `header_page.yaml`) — impossible within a single YAML file, but a real risk once split across files; must fail the check.
- **Docs updates** — `docs/agents/i18n.md`:
  - "Where translations live" — replace the single-file layout with the new directory structure.
  - "Adding a new language" — update from "add one new `<code>.yaml`" to "add a new `<code>/` directory mirroring `en/`'s exact file set" (enforced by `check_i18n`'s new mapping check).
  - No changes to "Using `Translator.t()` in components" in this issue — runtime behavior is unchanged; #1042 covers that once it actually changes runtime behavior.
- **Docs updates** — `.claude/agents/translator.md`:
  - Scope bullet: `frontend/assets/i18n/*.yaml` → `frontend/assets/i18n/<lang>/*.yaml`.
  - Development cycle step 1: edit the relevant namespace file inside the right language directory; when adding a *new* key, add it to the same-named file in every language directory, since `check_i18n` now also enforces identical namespace→file placement, not just identical keys.
  - Mention the new failure modes `check_i18n` reports (missing file for a language, namespace duplicated across files, namespace living under different filenames per language).

## Benefits

- The `translator` agent reads/writes small (~10–20 line) namespace files instead of an 816-line monolith for routine edits — the primary goal of this issue.
- Sets up the file layout #1042's lazy-loading needs, so that follow-up is purely additive (no further data reshaping required).
- `check_i18n` gains stronger validation (missing files, namespace/file mapping consistency, duplicate namespace across files) that has no equivalent risk today but will matter once translations are spread across many files.
