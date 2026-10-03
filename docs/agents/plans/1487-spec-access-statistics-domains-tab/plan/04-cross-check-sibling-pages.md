# Cross-check the sibling pages

Keep the shared pages consistent with the new spec:

- `shared-infrastructure.md` says the Domains tab endpoint is "which #1487 names (it must
  not reuse `domains.json`)": update it to name `domains/summary.json` with a link to
  `domains.md#api`.
- Check that the keys and rounding in `domains.md` match Overview's `visits`,
  `unique_visitors` and `average_duration_seconds` and Duration's
  `median_duration_seconds`, and that `domains.md` links (`data-model.md`,
  `shared-infrastructure.md` anchors) resolve.
- Confirm no code file changed (`git diff --stat` only lists `docs/`).

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — name the Domains tab
  endpoint.
