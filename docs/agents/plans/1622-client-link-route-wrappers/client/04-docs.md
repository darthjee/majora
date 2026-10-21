# Docs

- `docs/agents/client/library.md`: document the link sub-wrappers, their variant table, the
  members list and summaries in "Resource wrappers"; remove link routes from "Not yet
  wrapped" (leave photo uploads, #1623); mention that `acquire`/`remove` are `POST`s, never
  retried, and the scope rules (owning family `write`; `/all` acquire/remove also need the
  linked family's `read`), pointing at `docs/agents/access-control/token-scopes.md`.
- `client/README.md`: usage examples and update the "Work in progress" note.
- `docs/guides/client.md`: consumer-facing usage of the new methods.

## Files to Change

- `docs/agents/client/library.md`
- `client/README.md`
- `docs/guides/client.md`
