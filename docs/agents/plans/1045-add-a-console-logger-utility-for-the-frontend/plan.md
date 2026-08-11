# Plan: Add a console logger utility for the frontend

Issue: [1045-add-a-console-logger-utility-for-the-frontend.md](../issues/1045-add-a-console-logger-utility-for-the-frontend.md)

## Overview

`TranslationLoader.#load` (from the already-merged #1042) silently swallows a
failed dynamic `import()` for a lazy translation chunk. The frontend already
has a sanctioned logging utility for exactly this kind of soft failure,
`MajoraLogger`, currently used by three other consumers but undocumented.
This plan wires `MajoraLogger.warn` into `TranslationLoader`'s catch block,
adds spec coverage for it, and documents the `MajoraLogger` convention so
future soft-failure paths follow the same pattern instead of scattering
ad-hoc `console.*` calls.

Single-domain issue — everything here is inside `frontend/` (code, specs)
and `docs/agents/frontend/` (its own conventions doc), so no agent split is
needed.

## Context

- `frontend/assets/js/i18n/TranslationLoader.js`'s `#load` method currently
  has:

  ```js
  } catch {
    entry.state = 'failed';
  }
  ```

  No logging, no context — the failure is invisible today.
- `frontend/assets/js/utils/logging/MajoraLogger.js` is a build-time-gated
  static class (`error`/`warn`/`info`/`debug`) reading
  `VITE_FRONTEND_LOG_LEVEL` from `import.meta.env` (default `error` when
  unset). Only levels at-or-above (i.e. as-or-more severe than) the
  configured level are actually emitted — with the default, only `error`
  shows without explicit configuration.
- Three existing consumers all call it at `debug`, each assembling one plain
  object as the single `data` argument (no `(message, context)` two-arg
  shape): `frontend/assets/js/utils/requests/RequestStoreLogging.js`,
  `frontend/assets/js/utils/access/store/AccessStoreLogging.js`, and
  `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js`.
  Each has a matching spec (`RequestStoreLoggingSpec.js`,
  `AccessStoreLoggingSpec.js`, plus `MajoraLoggerSpec.js` for the class
  itself) that follows the same `spyOn(MajoraLogger, '<level>')` +
  `toHaveBeenCalledWith({...})` pattern.
- `TranslationLoaderSpec.js` already has a test for the rejected-import path
  (`'flips a rejected import to a failed state and returns undefined'`,
  around line 83) that this plan extends rather than duplicates.
- `docs/agents/frontend/` is split into topic files linked from
  `index.md` (e.g. `api-client-requests.md`, in a prose-with-backtick-refs
  style). No file currently documents `MajoraLogger`.
- Log level decision (already settled in the issue): `warn`, not `debug` or
  `error` — the failure is a designed-for, non-fatal degradation (stale
  chunk URL after deploy, network blip), so `error` would overstate it, and
  matching the existing consumers' opt-in-visibility convention (rather than
  mislabeling severity to force default visibility) keeps `MajoraLogger`'s
  semantics consistent across all four consumers.

## Implementation Steps

### Step 1 — Log the chunk-load failure in `TranslationLoader`

In `frontend/assets/js/i18n/TranslationLoader.js`:

- Add `import MajoraLogger from '../utils/logging/MajoraLogger.js';` at the
  top.
- Change `#load`'s `catch` block to capture the error and log it at `warn`
  before setting the failed state:

  ```js
  } catch (error) {
    entry.state = 'failed';
    MajoraLogger.warn({
      event: 'translation-chunk-load-failed',
      language: entry.language,
      namespace: entry.namespace,
      error,
    });
  }
  ```

### Step 2 — Extend `TranslationLoaderSpec.js`

- Add `spyOn(MajoraLogger, 'warn')` (mirroring
  `RequestStoreLoggingSpec.js`'s `beforeEach`) and import `MajoraLogger`.
- Extend the existing `'flips a rejected import to a failed state and
  returns undefined'` test (or add a sibling test right next to it) to
  assert `MajoraLogger.warn` was called once, with an object containing
  `event: 'translation-chunk-load-failed'`, the requested `language` and
  `namespace`, and an `error` field — matching the
  `toHaveBeenCalledWith({...})` style already used in
  `RequestStoreLoggingSpec.js`/`AccessStoreLoggingSpec.js`.

### Step 3 — Document the `MajoraLogger` convention

Add `docs/agents/frontend/logging.md`, in the same prose-with-backtick-refs
style as `docs/agents/frontend/api-client-requests.md`, covering:

- What `MajoraLogger` is: the sanctioned `console` wrapper, its four levels,
  and the `VITE_FRONTEND_LOG_LEVEL` / `CONFIGURED_LEVEL` gating semantics —
  spelling out that only `error` is emitted by default, and `warn`/`info`/
  `debug` require explicit configuration to show.
- When to use each level: `debug` for opt-in diagnostics (existing
  `RequestStoreLogging`/`AccessStoreLogging`/`MemoryCacheCardController`
  examples), `warn` for non-fatal-but-noteworthy soft failures (the new
  `TranslationLoader` example), `error` reserved for actual defects.
- The single-object-`data`-arg call convention, with a short
  `AccessStoreLogging`-style example.
- A pointer to `MajoraLoggerSpec.js` / `RequestStoreLoggingSpec.js` /
  `AccessStoreLoggingSpec.js` as the pattern to mirror when testing a new
  consumer (`spyOn(MajoraLogger, '<level>')` + `toHaveBeenCalledWith`).

Add a line for `logging.md` to `docs/agents/frontend/index.md`'s file list.

## Files to Change

- `frontend/assets/js/i18n/TranslationLoader.js` — import `MajoraLogger`;
  log a `warn`-level entry in `#load`'s `catch` block instead of swallowing
  the rejection.
- `frontend/specs/assets/js/i18n/TranslationLoaderSpec.js` — spy on
  `MajoraLogger.warn` and assert it's called with the expected context on a
  rejected import.
- `docs/agents/frontend/logging.md` — new file documenting the
  `MajoraLogger` convention.
- `docs/agents/frontend/index.md` — add the new file to the list.

## CI Checks

- `frontend`: `npm run coverage` (or `npm test`) (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No API change to `MajoraLogger` itself — it already supports everything
  this consumer needs.
- `docs/agents/documentation.md`'s Markdown formatting rules apply to the
  new `logging.md` file (blank line before/after every heading and list).
- No dependency on any unmerged work — #1042 (`TranslationLoader` itself) is
  already merged (`38dc5929`, PR #1046).
