# Consumer guide

Add a consumer-facing guide for automation authors and fix the outdated authentication
section of the API guide.

- **New `docs/guides/client.md`** (add pages under `docs/guides/client/` only if it grows):
  - creating a token in the UI (where the page is, choosing scopes, restricting to games,
    expiry, copying the secret once, renaming and revoking);
  - the scope catalogue in user terms, the "never more than the owner" rule and the per-game
    restriction, linking `docs/agents/access-control/token-scopes.md` for details;
  - sending `Authorization: Bearer mjr_...` directly;
  - installing `majora-client` from npm, a short library quickstart and a short CLI quickstart
    (`MAJORA_URL`, `MAJORA_TOKEN`), linking `client/README.md` for the full usage reference
    instead of copying it.
- **`docs/guides/majora.md`**: rewrite the "Authentication" section to describe scoped
  `Authorization: Bearer mjr_...` tokens as the recommended path for automations, keep the
  legacy `Authorization: Token <key>` header (still used by the crawler) and the session
  cookie, and update "Obtaining a token today". Link `client.md`.
- **Hubs**: link the guide from `AGENTS.md` (the `docs/guides/` paragraph near line 111),
  `docs/agents/client.md` and the "Documentation" section of `client/README.md`.

## Files to Change

- `docs/guides/client.md` — new.
- `docs/guides/majora.md` — rewrite "Authentication"; link the client guide.
- `AGENTS.md` — link the client guide next to the API guide.
