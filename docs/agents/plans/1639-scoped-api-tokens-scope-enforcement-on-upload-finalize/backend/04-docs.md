# Update the access-control docs

- `docs/agents/access-control/token-scopes.md`:
  - In the intro paragraph, remove #1639 from the "still pending" list.
  - In the Uploads section, replace "tracked by #1639; until then finalize is undeclared" with the final rule and the full model → scopes table from step 01: `PATCH=[]` declaration, check order, staff/copy rejection, fail-closed on unmapped models.
  - In Per-game restriction, add finalize to the "views enforce the list themselves" cases.
- `docs/agents/access-control/upload.md`: add a short line saying that scoped tokens are checked in the view and linking to the Uploads section, if the file describes finalize authorization.

## Files to Change
- `docs/agents/access-control/token-scopes.md` — final upload rules.
- `docs/agents/access-control/upload.md` — cross-reference (if relevant).
