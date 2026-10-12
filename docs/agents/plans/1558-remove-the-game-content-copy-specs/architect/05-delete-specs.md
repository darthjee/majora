# Delete the specs and their hub entry

Only after steps 01–04 and the backend/proxy comment repoints:

- `git rm docs/agents/specs/game-content-copy.md` and `git rm -r docs/agents/specs/game-content-copy/`.
- Remove the `- [Game Content Copy](specs/game-content-copy.md)` line from "Active specs" in
  `docs/agents/specs.md`.
- Verify: `grep -rn "specs/game-content-copy" . --exclude-dir=node_modules --exclude-dir=.git`
  returns hits only under `docs/agents/issues/` and `docs/agents/plans/`.

## Files to Change

- `docs/agents/specs/game-content-copy.md`: deleted.
- `docs/agents/specs/game-content-copy/`: deleted (10 files).
- `docs/agents/specs.md`: drop the entry.
