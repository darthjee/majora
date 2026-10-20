# Docs

Document the new wrapper and remove document pages from the "not yet wrapped" lists.

- `docs/agents/client/library.md`:
  - "Module layout": mention nested sub-resources (`DocumentPages`) under `resources/`.
  - "Accessors": add `documents.pages(id)` with an example; reword "There is no `delete`" to
    say that the only `DELETE` is `DocumentPages.trim(keep)` (bulk trim), with no per-record
    delete.
  - "Regular and restricted variants": add the `DocumentPages` variant table (list, create,
    update, trim, bumpVersion; no `get`).
  - "Not yet wrapped": drop document pages (#1621), keeping link routes (#1622) and photo
    uploads (#1623).
- `client/README.md`: add `game.documents.pages(id)` to the wrapper table (line ~76) and the
  variant table (line ~100), with a short usage example; update the "Work in progress" note.
  The CLI table stays unchanged (library only).
- `docs/guides/client.md`: add a short consumer example for document pages (list, trim,
  bump version) if the guide lists per-family usage.

## Files to Change

- `docs/agents/client/library.md` — wrapper, variants and "Not yet wrapped".
- `client/README.md` — usage, tables and "Work in progress" note.
- `docs/guides/client.md` — consumer usage.
