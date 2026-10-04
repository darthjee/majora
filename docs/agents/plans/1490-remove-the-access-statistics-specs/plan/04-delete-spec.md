# Delete the spec and check links

1. Delete `docs/agents/specs/access-statistics.md` and the whole
   `docs/agents/specs/access-statistics/` folder.
2. Remove the `- [Access Statistics](specs/access-statistics.md)` line from "Active specs"
   in `docs/agents/specs.md`.
3. Run `grep -rn "specs/access-statistics" --include=*.md . | grep -v "docs/agents/issues/"
   | grep -v "docs/agents/plans/"`. It must return nothing. Also check `AGENTS.md`,
   `.claude/agents/*.md` and `docs/agents/cache-warmer.md`.
4. Run `docker-compose run --rm markdownlint` and fix any findings.

## Files to Change

- `docs/agents/specs/access-statistics.md` — delete.
- `docs/agents/specs/access-statistics/` — delete (all ten pages).
- `docs/agents/specs.md` — remove the "Active specs" entry.
