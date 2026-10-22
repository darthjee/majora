# Update token-scopes.md

Remove every mention of the pending list from `docs/agents/access-control/token-scopes.md`:

- **Status paragraph**: replace "Only the game photos and their upload init are still on the
  coverage test's pending list, and #1665 adds those declarations. Until a view is declared, it
  refuses every scoped token…" with a sentence saying the game photos and their upload init are
  declared (#1665), so every DRF view is now declared or excluded. Keep the fail-closed rule for
  future undeclared views.
- **Coverage test** bullet: drop "or be in `PENDING_TOKEN_SCOPES`".
- **Declaring scopes on a view**: drop the bullet about removing a view from
  `PENDING_TOKEN_SCOPES`.

Run `yarn lint_md` to check line length and formatting.

## Files to Change
- `docs/agents/access-control/token-scopes.md` — Status, Coverage test and declaration sections.
