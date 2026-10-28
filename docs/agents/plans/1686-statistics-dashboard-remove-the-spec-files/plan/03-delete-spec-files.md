# Delete the spec files and check for dangling links

Delete the spec index and its folder with `git rm`. Then run:

```bash
grep -rn "statistics_dashboard" AGENTS.md CLAUDE.md docs .claude \
  | grep -v "^docs/agents/issues/" | grep -v "^docs/agents/plans/"
```

It must return nothing. Also check that the `#audit-log` anchor resolves in `statistics.md`,
then run the markdown lint.

## Files to Change

- `docs/agents/specs/statistics_dashboard.md`: delete.
- `docs/agents/specs/statistics_dashboard/` (all four files): delete.
