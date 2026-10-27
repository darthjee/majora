# Register the spec and lint

1. Add `- [Statistics Dashboard](specs/statistics_dashboard.md)` under `## Active specs` in
   `docs/agents/specs.md`. Register it there only, never in `AGENTS.md` (the hub rule).
2. Check that every relative link in the index and the topic pages resolves: the index ↔ pages
   and the pages → index `## Open questions`.
3. Run the markdown linter, `docker-compose run --rm markdownlint`, and fix any findings.
4. Confirm that no file outside `docs/agents/specs.md` and `docs/agents/specs/statistics_dashboard*`
   changed (the issue is documentation only).

## Files to Change

- `docs/agents/specs.md` — register the new spec under *Active specs*.
