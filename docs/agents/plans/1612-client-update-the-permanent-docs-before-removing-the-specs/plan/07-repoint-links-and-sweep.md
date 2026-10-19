# Repoint links and final sweep

Remove the remaining links to the spec and confirm nothing permanent depends on it.

- `docs/agents/contributing.md` (~line 54): point the packaging-spec link to
  `client/packaging.md#release` (or the matching anchor).
- `client/README.md` "Documentation" section (~line 322): replace the spec links with
  `docs/agents/client.md` and `docs/guides/client.md`.
- `.claude/agents/client.md` (~lines 27 and 57-58): point to `docs/agents/client.md`,
  `docs/agents/client/{library,cli,packaging}.md` and `access-control/token-scopes.md`
  instead of the spec.
- Sweep: `grep -rn "specs/client" --include=*.md --include=*.yaml . | grep -v
  "^./docs/agents/specs/" | grep -v "^./docs/agents/issues/" | grep -v
  "^./docs/agents/plans/"` must return only `docs/agents/specs.md` (removed by #1613).
- Check that every new page is reachable from a hub (`docs/agents/index.md`, `AGENTS.md`
  documentation table if it lists hubs, `access-control.md`, `frontend/index.md`,
  `docs/guides/majora.md`) and that relative links resolve.

## Files to Change

- `docs/agents/contributing.md` — repoint the packaging spec link.
- `client/README.md` — repoint the documentation links.
- `.claude/agents/client.md` — repoint the spec references.
- `docs/agents/index.md` — register the new client pages, if it lists sub-pages.
