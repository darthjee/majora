# Documentation

- `docs/agents/client/library.md`: remove photo uploads from "Not yet wrapped"; document the
  methods, variants (all `restricted: null`), which families have which action, the two-step
  flow, the 120 s submit timeout, the accepted file inputs, and the new `HttpClient` option.
  Mention the #1639 dependency for scoped tokens.
- `client/README.md`: usage example (upload from a `Buffer` with `filename`, set as main, delete)
  and update the "Work in progress" note.
- `docs/guides/client.md`: add a short photo upload section.

Run markdownlint on the changed files.

## Files to Change

- `docs/agents/client/library.md`
- `client/README.md`
- `docs/guides/client.md`
