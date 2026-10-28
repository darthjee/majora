# Docs page

Create `docs/agents/investigator.md`, shaped like `docs/agents/client.md`:

- **Why it exists** — investigations need tooling that is neither application code nor infra and
  that touches production data; Epic #1696 (statistics sessions) is the first user.
- **Investigation folders** — `investigations/<topic>/` layout (scripts, own
  `docker-compose.yml`, `README.md`, `.gitignore` for reports), excluded from CI, temporary:
  deleted once solved, with durable knowledge moved to the relevant `docs/agents/` page.
- **Ownership boundaries** — `investigator` owns the folder contents; `infra` owns wiring outside
  it; application code stays with its specialists (read-only for the investigator).
- **Safety rules** — the same rules as the agent file, stated once here as the reference.

## Files to Change

- `docs/agents/investigator.md` — new docs page.
