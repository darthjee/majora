# Roster and index entries

List the agent and the folder everywhere the `client` agent is listed:

- `.claude/agents/architect.md` — add an `investigator` row to the delegation table
  (`investigations/<topic>/` — temporary investigation tooling, production reads only with user
  authorization; see `docs/agents/investigator.md`) and an `investigator.md` row to the docs
  table.
- `AGENTS.md` — add an *Investigator Agent* row to the documentation index, after *Client Agent*.
- `docs/agents/summary.md` — add an *Investigator Agent* bullet after *Client Agent*.
- `docs/agents/folder-structure.md` — add an `investigations/` row ("Temporary, standalone
  investigation tooling, one folder per topic. Not created yet — scaffolded by #1702; owned by the
  `investigator` agent.") and add `investigator.md` to the list of top-level docs.

## Files to Change

- `.claude/agents/architect.md` — roster and docs table rows.
- `AGENTS.md` — documentation index row.
- `docs/agents/summary.md` — summary bullet.
- `docs/agents/folder-structure.md` — folder row and docs list entry.
