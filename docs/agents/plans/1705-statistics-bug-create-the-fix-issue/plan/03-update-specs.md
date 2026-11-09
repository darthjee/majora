# Point the investigation specs at the fix Epic

- `docs/agents/specs/statistics-bug/findings.md`: add a short *Fix* section linking the fix
  Epic by number and listing the owner's decisions (direct host stops being exposed, session
  reused on an IP change, scope and export endpoint removed in the cleanup).
- `docs/agents/specs/statistics-bug.md`: mention the fix Epic in the sub-issue table's
  surroundings (the table lists Epic #1696's own sub-issues; add one line below it naming the
  fix Epic), and in *Lifecycle* state that the removal is the fix Epic's cleanup sub-issue.

## Files to Change

- `docs/agents/specs/statistics-bug/findings.md` — *Fix* section.
- `docs/agents/specs/statistics-bug.md` — fix Epic reference.
