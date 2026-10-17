# Register the agent in rosters and indexes

Add `client` wherever `crawler` is listed, right after the `crawler` entries:

- `.claude/agents/architect.md`: a `client` row in the agent roster table (scope: `client/`,
  the Node.js library, CLI and npm package using scoped tokens, linking `docs/agents/client.md`),
  and a `client.md` row in the docs table.
- `AGENTS.md`: a "Client Agent" row in the documentation table.
- `docs/agents/index.md`: a "Client Agent" link under Conventions.
- `docs/agents/summary.md`: a "Client Agent" abstract.
- `docs/agents/folder-structure.md`: a `client/` row in the Project Root table (not created
  yet, scaffolded by #1607, owned by the `client` agent, unrelated to
  `frontend/assets/js/client/`), and `client.md` in the list of top-level docs.

## Files to Change

- `.claude/agents/architect.md`: roster and docs table rows.
- `AGENTS.md`: documentation table row.
- `docs/agents/index.md`: index link.
- `docs/agents/summary.md`: abstract.
- `docs/agents/folder-structure.md`: `client/` row and `client.md` doc entry.
