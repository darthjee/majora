# Issue: Add a console logger utility for the frontend

## Description

Came up while enhancing #1042 (lazy-load translation chunks per page and active language), which has since merged (`38dc5929`, PR #1046). Its `TranslationLoader.#load` handles a failed dynamic `import()` (e.g. a stale chunk URL after a deploy, or a network blip) by degrading gracefully — the same fallback-text behavior already used for a missing/typo'd translation key, with no crash and no blocking render. That's the right UX, but the `catch` block currently swallows the rejection completely, with no logging and no context — the failure is silent today, in code that's already live.

The frontend already has a dedicated logging utility for exactly this kind of soft failure: `frontend/assets/js/utils/logging/MajoraLogger.js`. It's a build-time-gated static class (`error`/`warn`/`info`/`debug`) reading `VITE_FRONTEND_LOG_LEVEL` from `import.meta.env`, defaulting to `error` when unset. It's already the sanctioned `console` wrapper (see its own `eslint-disable` comment) and is already used by three consumers — `RequestStoreLogging`, `AccessStoreLogging`, and `MemoryCacheCardController` — each with their own Jasmine spec, all logging at `debug` level.

So this issue is about **reusing `MajoraLogger`** for `TranslationLoader`'s soft-failure path, and about closing a documentation gap: nothing in `docs/agents` currently describes this logging convention, despite it already having three consumers.

## Problem

`TranslationLoader.#load` (`frontend/assets/js/i18n/TranslationLoader.js`) swallows a failed chunk `import()` silently:

```js
} catch {
  entry.state = 'failed';
}
```

There's no way to observe this happening — not in dev tools, not even with `VITE_FRONTEND_LOG_LEVEL` configured — even though the project already has a sanctioned logging utility (`MajoraLogger`) built for exactly this kind of non-fatal, soft-failure case. Separately, `MajoraLogger`'s conventions (level semantics, call shape, testing pattern) aren't documented anywhere in `docs/agents`, despite already having three consumers.

## Expected Behavior

A failed dynamic import for a translation chunk logs a `warn`-level entry via `MajoraLogger`, carrying the language, namespace, and the underlying error — visible when `VITE_FRONTEND_LOG_LEVEL` is set to `warn` or `debug`, consistent with how the other three consumers behave. The logging convention itself (level semantics, call shape, when to use `debug`/`warn`/`error`) is documented in `docs/agents/frontend/`.

## Solution

- Frontend: fix `TranslationLoader.#load`'s `catch` block (`frontend/assets/js/i18n/TranslationLoader.js`) to log via `MajoraLogger` instead of silently swallowing the rejection:

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

  plus `import MajoraLogger from '../utils/logging/MajoraLogger.js';` at the top. No API change needed — this follows the same single-object-arg convention `RequestStoreLogging`/`AccessStoreLogging` already use.

- Update `TranslationLoaderSpec.js` to cover the new logging call (e.g. spying on `MajoraLogger.warn` and asserting it's called with the expected context on a rejected import), matching the existing pattern in `MajoraLoggerSpec`/`RequestStoreLoggingSpec`/`AccessStoreLoggingSpec`.

- Log at `warn`, not `debug` or `error`. The failure is designed to be non-fatal (graceful degradation, no crash, no blocking render) and is triggered by expected transient conditions (a stale chunk URL right after a deploy, a network blip) — not a code defect, so `error` would be a semantic mismatch. Note that under `MajoraLogger`'s current gating (`CONFIGURED_LEVEL` defaults to `'error'`, and only levels at-or-above that threshold are emitted), `warn` stays silent unless `VITE_FRONTEND_LOG_LEVEL` is explicitly set — same as the existing `debug` consumers. Solving default-visibility by mislabeling this call `error` would misuse the severity level to route around the gating instead of fixing it, and would affect the other three `MajoraLogger` consumers too. If default-without-configuration visibility for transient degradations like this is genuinely wanted, that's a separate, broader decision (e.g. revisiting `DEFAULT_LEVEL` or adding a reporting sink) — out of scope for this issue.

- Docs: add `docs/agents/frontend/logging.md`, following the prose-with-backtick-refs style already used by `docs/agents/frontend/api-client-requests.md`, and link it from `docs/agents/frontend/index.md`'s file list. Content:
  - What `MajoraLogger` is and its level-gating semantics (`CONFIGURED_LEVEL` from `VITE_FRONTEND_LOG_LEVEL`, default `error`, and the consequence that only `error` is emitted without explicit configuration).
  - When to use `debug` vs `warn` vs `error` — opt-in diagnostics (`debug`) vs non-fatal-but-noteworthy soft failures (`warn`) vs actual defects (`error`) — citing the existing consumers (`RequestStoreLogging`, `AccessStoreLogging`, `MemoryCacheCardController`) plus the new `TranslationLoader` one as examples.
  - The single-object-`data`-arg convention, with an `AccessStoreLogging`-style example.
  - A pointer to `MajoraLoggerSpec.js` / `RequestStoreLoggingSpec.js` / `AccessStoreLoggingSpec.js` as the testing pattern to mirror.

## Benefits

- Failed translation chunk loads become observable (opt-in via `VITE_FRONTEND_LOG_LEVEL`) instead of disappearing entirely.
- Establishes and documents a consistent logging convention, so future soft-failure paths reuse `MajoraLogger` instead of scattering ad-hoc `console.*` calls.
- No new utility, no API surface change — reuses what already exists and is already tested.
