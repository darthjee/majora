# Update the hub and check consistency

- In `docs/agents/specs/client.md`, check that the Token API entry under the aspect pages
  ("owner and staff token endpoints, access control, `X-Skip-Cache`, and how the proxy and the
  cache treat Bearer requests") still summarises the page. Adjust it only if it no longer does.
  Leave the sub-issue table unchanged.
- Cross-check that `token-api.md`, `tokens.md` and `scopes.md` agree:
  - error codes (`token_invalid`, `token_not_allowed`, `game_not_allowed`, `scope_missing`);
  - duplicates giving 400;
  - session-only routes;
  - "no per-user limit".
  Fix any wording that contradicts.
- Check that every relative link added in steps 01 and 02 resolves.
- Run the markdown lint (`yarn lint_md` through the project's docker-compose/make wrapper) and
  fix any findings.

## Files to Change

- `docs/agents/specs/client.md`: only if its Token API summary needs adjusting.
- `docs/agents/specs/client/token-api.md`, `docs/agents/specs/client/tokens.md`: lint and link
  fixes, if any.
