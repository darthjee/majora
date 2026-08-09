# Add a console logger utility for the frontend

## Context

Came up while enhancing #1042 (lazy-load translation chunks per page and active
language). That issue's `TranslationLoader` needs to handle a failed dynamic
`import()` (e.g. a stale chunk URL after a deploy, or a network blip) by
degrading gracefully — the same fallback-text behavior already used for a
missing/typo'd translation key, with no crash and no blocking render. That's
the right UX, but it means the failure is otherwise silent: there's no caller
to `catch` it and no existing convention for surfacing it.

The frontend codebase currently has zero `console.error`/`console.warn` calls
anywhere. The closest existing pattern, `GenericClient`, just `throw`s on a
failed request and relies on a caller up the stack to handle it — that doesn't
fit soft-failure paths (a missing key, a failed lazy chunk load) that are
designed to never throw in the first place. We want a small, dedicated
logging utility so these soft failures can be surfaced consistently (e.g.
visible in dev tools) without scattering ad-hoc raw `console.*` calls through
the codebase as more of these soft-failure paths show up.

## What needs to be done

- Frontend: introduce a small logging utility (e.g.
  `frontend/assets/js/utils/Logger.js`) exposing a consistent API (e.g.
  `Logger.warn(message, context)` / `Logger.error(...)`), matching the
  project's existing style of small, single-responsibility hand-rolled
  utilities (`LanguageStorage`, `LanguageEvents`, `AuthEvents`, etc.).
- Decide behavior across environments — whether it always logs to the
  console, and whether/how test output should be suppressed or instead
  asserted against in specs.
- Wire it into the first known consumer: #1042's `TranslationLoader`, to log
  a warning when a lazy translation chunk's dynamic `import()` rejects.
- Docs: document the logging convention (where to add calls, warn vs. error)
  in the relevant `docs/agents` doc.

## Acceptance criteria

- [ ] TODO
