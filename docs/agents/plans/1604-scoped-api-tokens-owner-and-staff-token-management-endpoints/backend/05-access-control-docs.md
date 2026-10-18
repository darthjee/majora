# Document the endpoints in access control

Ship the doc changes listed in the spec's *Access-control documentation* section in the same PR:

- New `docs/agents/access-control/api-token.md`. It covers:
  - the category (an account resource on the owner side, a staff resource on the staff side, a single variant, `X-Skip-Cache: true`);
  - the actions, each marked **session only**, with a scoped token getting 403 `token_not_allowed`;
  - the fields (the token item; never the secret or the hash; the full token only on create; only `name` writable, anything else `not_editable`);
  - the lookups (scoped, 404 otherwise);
  - the lifecycle (revoke deletes the row, deny auto-revokes, a future game delete must revoke tokens that list the game);
  - a link to `specs/client/scopes.md` for the scope rules.
- `docs/agents/access-control.md`: list the new page under *Models / resources*.
- `docs/agents/access-control/user.md`: add the two staff rows, linking to `api-token.md`, and say that deny also deletes the user's scoped tokens.
- `docs/agents/access-control/principles.md`: add `account/api_tokens` to the `account/*` routes, and the owner `DELETE account/api_tokens/<id>.json` to the non-staff `DELETE` exceptions.
- `docs/agents/access-control/endpoints.md`: add the 7 method + URL rows.
- `docs/agents/no-private-cache-routes.md`: add `GET /account/api_tokens.json`, `GET /account/api_tokens/options.json` and `GET /staff/users/<id>/api-tokens.json`.
- `docs/agents/specs/client/token-api.md`: in *Affected code* and *Caching, proxy and Navi*, point the Bearer cache work to #1643 instead of #1604.
- `permissions.yaml`: no change.

## Files to Change
- `docs/agents/access-control/api-token.md` — new.
- `docs/agents/access-control.md`, `docs/agents/access-control/user.md`, `docs/agents/access-control/principles.md`, `docs/agents/access-control/endpoints.md`, `docs/agents/no-private-cache-routes.md`, `docs/agents/specs/client/token-api.md` — updated.
