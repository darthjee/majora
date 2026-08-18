# Issue: Non-literal filesystem calls in i18n check script and jsx-loader

## Description
Codacy's ESLint security scan (`security/detect-non-literal-fs-filename`) flags 4 filesystem calls built from non-literal (dynamic) paths:

- `frontend/scripts/check_i18n.js` — `readFileSync`, `statSync`, `readdirSync` (3 occurrences)
- `frontend/specs/support/jsx-loader.mjs` — `readFileSync` (1 occurrence)

Both files are build/tooling scripts (a CI lint script and a Node module loader used only for running Jasmine specs), not request-handling code, so there is no direct external-attacker input at runtime. The rule still flags them because it cannot see, statically, whether the dynamic path segments are trusted.

## Problem
A manual review of both files confirms every dynamic path segment is built entirely from trusted, local sources — never from external or user-supplied input:

- `check_i18n.js`: `I18N_DIR` is derived from `__dirname` (a repo-local constant). `listLanguageDirs()` and `listChunkFiles()` join it only with entries returned by `readdirSync()` on that same trusted directory (filtered to directories, or to `*.yaml` files) — i.e. the script walks its own known directory tree, it does not accept an externally supplied path.
- `jsx-loader.mjs`: the `url`/`filePath` values come from Node's own module resolution system, driven by `import` specifiers written in this repo's own source and spec files — not from any network or user input. It is a Jasmine-only test loader, never loaded in production.

So this is effectively a false positive from the lint rule's perspective: there is no untrusted input to validate, and a `PathTraversalGuard`-style runtime check (as used in `proxy/extension/lib/support/PathTraversalGuard.php` for user-uploaded file paths) would add complexity without addressing any real risk here.

## Solution
Suppress each of the 4 flagged calls with a justified inline `// eslint-disable-next-line security/detect-non-literal-fs-filename -- <reason>` comment, following the existing repo convention (e.g. `frontend/assets/js/utils/logging/MajoraLogger.js`), explaining in each case that the path is built only from trusted, repo-local sources (directory walk results / Node's own module resolution), never external input. No runtime path validation (e.g. `PathTraversalGuard`) is needed since there is no untrusted input to guard against.

## Benefits
- Clears the 4 Codacy security findings.
- Leaves a durable, in-code explanation of why each dynamic path is safe, for future readers and future lint runs.
