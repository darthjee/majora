## Logging

`utils/logging/MajoraLogger.js` is the sanctioned `console` wrapper for the frontend — its
`#log` method carries an `eslint-disable no-console` comment for exactly this reason, so no
other frontend code should call `console.*` directly.

It is a build-time-gated static class with four levels, most to least severe: `error`,
`warn`, `info`, `debug`. At module load it reads `VITE_FRONTEND_LOG_LEVEL` from
`import.meta.env` into `CONFIGURED_LEVEL`, falling back to `'error'` when the env var is
unset or isn't one of the four known level names. Each static method (`MajoraLogger.error`,
`.warn`, `.info`, `.debug`) only delegates to the matching `console` method when that level
is at-or-above (i.e. as-or-more severe than) `CONFIGURED_LEVEL`; otherwise it's a silent
no-op. In practice this means **only `error` is emitted by default** — `warn`, `info`, and
`debug` all require `VITE_FRONTEND_LOG_LEVEL` to be explicitly set (to `warn`, `info`, or
`debug`) before they show up anywhere.

## Choosing a level

- **`debug`** — opt-in diagnostics for tracing normal operation, not failures. Used by
  `utils/requests/RequestStoreLogging.js` and `utils/access/store/AccessStoreLogging.js` to
  report the outcome (`result` or `error`) of every resource/permission fetch, and by
  `components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js`
  for its own operational tracing.
- **`warn`** — a non-fatal, designed-for soft failure: something degraded gracefully (no
  crash, no blocking render) but is still worth surfacing when someone opts in. Example:
  `i18n/TranslationLoader.js`'s `#load` logs at `warn` when a lazy translation chunk's
  dynamic `import()` rejects (e.g. a stale chunk URL right after a deploy, or a network
  blip) — the loader still falls back to raw translation keys, but the failure is no longer
  silent.
- **`error`** — reserved for actual defects, since it's the only level visible without any
  configuration. Do not use `error` just to force default visibility for a call that isn't
  actually a defect — that misuses the severity level to route around the gating instead of
  fixing it (and, for `MajoraLogger.error` specifically, affects every consumer's perceived
  severity, not just yours).

## Call shape

Every level method takes a single `data` argument — one plain object gathering everything
relevant to the entry, no `(message, context)` two-arg shape. Example, from
`AccessStoreLogging.wrap`:

```js
fetcherPromise.then(
  (result) => MajoraLogger.debug({ method, args, ...meta, result }),
  (error) => MajoraLogger.debug({ method, args, ...meta, error }),
);
```

`TranslationLoader` follows the same convention for its `warn` call, including an `event`
field to identify the call site when multiple `MajoraLogger.warn` consumers exist:

```js
MajoraLogger.warn({
  event: 'translation-chunk-load-failed',
  language: entry.language,
  namespace: entry.namespace,
  error,
});
```

## Testing

Mirror the existing specs when adding a new `MajoraLogger` consumer:
`MajoraLoggerSpec.js` tests the class itself (level gating); `RequestStoreLoggingSpec.js`
and `AccessStoreLoggingSpec.js` test consumers. The pattern is
`spyOn(MajoraLogger, '<level>')` in a `beforeEach`, then
`expect(<level>Spy).toHaveBeenCalledWith({ ...expected fields... })` on the call under test.
