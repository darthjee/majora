# Access-control doc sync

Update `docs/agents/access-control/staff-statistics.md` to match what shipped:

- Change the "Status: planned" note to say the shared endpoint (`domains.json`) and the filter
  validation are live, and that tab endpoints still land with their own sub-issues.
- Check that the validation codes and the check order described there match the
  implementation.

Do not touch `docs/agents/permissions.yaml` or `navi/`.

## Files to Change

- `docs/agents/access-control/staff-statistics.md`: status note and any drift from the
  implementation.
