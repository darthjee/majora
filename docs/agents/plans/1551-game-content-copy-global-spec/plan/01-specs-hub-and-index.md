# Specs hub and index

Make `docs/agents/specs.md` the permanent hub for feature spec entrypoints and register the new
spec there.

- Add a `| [Specs](docs/agents/specs.md) | Hub of active feature specs (design docs removed once
  the feature is implemented). |` row to `AGENTS.md`'s documentation table (next to Plans/Issues).
  This is the only `AGENTS.md` change, made once; feature specs are never listed there directly.
- Add `- [Game Content Copy](specs/game-content-copy.md)` under "Active specs" in
  `docs/agents/specs.md`, and state in its intro that every feature spec registers only here.
- Create `docs/agents/specs/game-content-copy.md`: a short index in the style of
  `specs/loot-crawling.md` — one-paragraph summary (staff-only Admin page, six tabs, per-entity
  copy, hard-linked uploads), then `## Global pages` linking the four pages from steps 02–05 and
  `## Tab pages` listing the six tab pages as pending (#1552–#1557).

## Files to Change

- `AGENTS.md` — add the Specs hub row.
- `docs/agents/specs.md` — add the entry and the "register only here" note.
- `docs/agents/specs/game-content-copy.md` — new index.
