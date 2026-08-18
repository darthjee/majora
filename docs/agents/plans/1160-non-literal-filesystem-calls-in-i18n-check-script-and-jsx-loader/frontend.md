# Frontend Plan: Non-literal filesystem calls in i18n check script and jsx-loader

Main plan: [plan.md](plan.md)

## Overview

Codacy's ESLint security scan (`security/detect-non-literal-fs-filename`) flags 4 filesystem calls built from dynamic paths:

- `frontend/scripts/check_i18n.js` — `readdirSync` (line 34), `statSync` (line 34), `readdirSync` (line 47), `readFileSync` (line 70) — 4 call sites, 3 distinct rule occurrences per the issue (the `readdirSync`/`statSync` pair on line 34 is one call each but the issue groups them as 3 occurrences total: `readFileSync`, `statSync`, `readdirSync`)
- `frontend/specs/support/jsx-loader.mjs` — `readFileSync` (lines 47, 56, 98) — 1 rule occurrence per the issue, covering 3 call sites that all follow the same `fileURLToPath(url)` → `readFileSync` pattern

Both are CI/dev-only tooling: `check_i18n.js` runs via `npm run check_i18n` (CI job `frontend-checks`) to verify translation key parity across languages, and `jsx-loader.mjs` is a Node module loader used only via `NODE_OPTIONS='--loader ...'` when running Jasmine specs (`npm run test`/`npm run coverage`, CI job `jasmine`). Neither ships to production or handles runtime request input.

## Context

Manual review confirms every dynamic path segment in both files is built entirely from trusted, local sources:

- **`check_i18n.js`**: `I18N_DIR` is `join(__dirname, '..', 'assets', 'i18n')` — a constant derived from the script's own location, not input. `listLanguageDirs()` calls `readdirSync(I18N_DIR)` then `statSync(join(I18N_DIR, entry))` only on entries `readdirSync` itself returned for that trusted directory. `listChunkFiles(language)` calls `readdirSync(dir)` where `dir = join(I18N_DIR, language)` and `language` is itself one of those same `readdirSync` results (never anything else — the only caller is `loadLanguage`, invoked from `checkI18n()` over `listLanguageDirs()`'s output). `loadLanguage` then calls `readFileSync(filePath)` only on paths `listChunkFiles` produced. Every path segment traces back to `__dirname` or to a directory listing of a directory that itself traces back to `__dirname` — there is no external input anywhere in the chain.
- **`jsx-loader.mjs`**: all 3 `readFileSync(filePath, 'utf-8')` calls take `filePath = fileURLToPath(url)`, where `url` is supplied by Node's own ESM loader hook chain (the `resolve`/`load` hook arguments), ultimately driven by `import` specifiers written in this repo's own source and spec files. It is registered only for local Jasmine test runs, never in production.

This matches the trust analysis already written into the issue file. Since there is no untrusted input anywhere in either file, no `PathTraversalGuard`-style runtime validation (the pattern used in `proxy/extension/lib/support/PathTraversalGuard.php` for user-uploaded file paths) is needed or appropriate here — that pattern exists to validate paths built from *untrusted* input, which these are not. The chosen approach is documentation via inline suppression, matching this repo's existing precedent at `frontend/assets/js/utils/logging/MajoraLogger.js:67`:

```js
// eslint-disable-next-line no-console -- MajoraLogger is the sanctioned console wrapper.
```

## Implementation Steps

### Step 1 — Suppress the 3 flagged calls in `check_i18n.js`

In `frontend/scripts/check_i18n.js`, add a justified `// eslint-disable-next-line security/detect-non-literal-fs-filename -- <reason>` comment directly above each flagged call:

- `readdirSync(I18N_DIR)` (inside `listLanguageDirs`, line 34) and `statSync(join(I18N_DIR, entry))` (same line) — note both are on one line; if Codacy reports them as separate occurrences, an `eslint-disable-line` (not `-next-line`) trailing comment on that same line covers both, since ESLint disable comments suppress every violation on the line they target regardless of rule occurrence count. Reason: "`I18N_DIR` is derived from `__dirname`; `entry` is itself a result of `readdirSync(I18N_DIR)` — both trace back only to this script's own trusted location, never external input."
- `readdirSync(dir)` (inside `listChunkFiles`, line 47) — same reasoning: `dir` is `join(I18N_DIR, language)` where `language` always comes from `listLanguageDirs()`'s own `readdirSync` output.
- `readFileSync(filePath, 'utf8')` (inside `loadLanguage`, line 70) — `filePath` always comes from `listChunkFiles()`'s own `readdirSync`-derived output.

### Step 2 — Suppress the flagged call(s) in `jsx-loader.mjs`

In `frontend/specs/support/jsx-loader.mjs`, add the same style of justified comment above each of the 3 `readFileSync(filePath, 'utf-8')` call sites (lines 47, 56, 98). Reason: "`filePath` comes from Node's own ESM loader `url`, driven only by `import` specifiers in this repo's own source/spec files; this loader is registered for local Jasmine runs only, never in production."

If Codacy's own report attributes all 3 sites to a single logical finding, a shared comment style is fine — but suppress at each call site individually (not a blanket file-level disable) so the reasoning stays next to the code it explains, per the issue's chosen approach.

### Step 3 — Verify

Run the affected scripts locally to confirm behavior is unchanged (suppression comments are inert at runtime):

```bash
cd frontend
npm run check_i18n
npm run lint
npm run test
```

## Files to Change

- `frontend/scripts/check_i18n.js` — add 3 justified `eslint-disable` comments (readdirSync/statSync in `listLanguageDirs`, readdirSync in `listChunkFiles`, readFileSync in `loadLanguage`).
- `frontend/specs/support/jsx-loader.mjs` — add 3 justified `eslint-disable` comments (readFileSync in the `?raw` branch, the `.jsx` branch, and the trailing `.js` shim branch).

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — exercises `jsx-loader.mjs` on every spec run

## Notes

- `frontend/scripts/` is not in the local `npm run lint` target (`eslint assets specs`), so `check_i18n.js`'s suppression comments won't be locally lint-verified — only Codacy's separate engine run will confirm they clear the finding. `frontend/specs/support/jsx-loader.mjs` *is* covered by local lint (`specs/**`).
- No `.eslintrc`/`eslint.config.mjs` change is needed: the `security/detect-non-literal-fs-filename` rule comes from Codacy's own ESLint engine config, not this repo's local `eslint.config.mjs`, which doesn't register `eslint-plugin-security` at all — so an unmatched rule name in a disable comment won't trigger any local lint warning (no `--report-unused-disable-directives` flag is set in `npm run lint`).
- This was discussed and decided in the issue dialogue: inline per-call-site suppression was chosen over adding the 2 files to `.codacy.yml`'s `exclude_paths` (the pattern already used there for `duplication`/`bandit`/`phpmd`/`phpcs`), because inline comments keep the trust reasoning next to the code for future readers.
