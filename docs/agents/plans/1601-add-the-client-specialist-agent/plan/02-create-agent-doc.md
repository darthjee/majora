# Create the agent doc

Create `docs/agents/client.md`, following the shape of `docs/agents/crawler.md`:

- **Why it exists:** epic #1592 needs a Node.js client so automations can use the Majora API
  with fine-grained tokens; the `client` agent (`.claude/agents/client.md`) owns `client/`,
  which is scaffolded by #1607.
- **Relationship to the API and tokens:** the client authenticates with scoped
  `Bearer mjr_` tokens (link `specs/client/tokens.md` and `specs/client/scopes.md`), and the
  server enforces each token's scopes on top of the owner's own access. The `crawler/` is
  unchanged and still uses the legacy `Token` (link `crawler.md`).
- **Ownership boundaries:** what `client` owns and what `infra` keeps (compose service,
  Makefile targets, CI jobs, `bump_version.sh client`).
- **Naming:** `client/` is unrelated to `frontend/assets/js/client/`.
- **Lifecycle:** the spec is the current source of truth; #1612 moves this reference into
  permanent docs (and repoints the agent) before #1613 deletes the spec.

## Files to Change

- `docs/agents/client.md`: new doc.
