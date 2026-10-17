# Create the agent definition

Create `.claude/agents/client.md`, following the structure of `.claude/agents/crawler.md`.

- **Frontmatter:** `name: client`; a `description` that names `client/` (the Node.js Majora
  library, CLI and `majora-client` npm package that uses scoped API tokens), so the architect and
  `list_agents.sh` can match `client/` work to it; `tools: Read, Edit, Write, Bash`.
- **Your scope:** everything under `client/`: `src/` (the library and `src/cli/`), `bin/`,
  `specs/` (Jasmine), `eslint.config.mjs`, `package.json` (scripts, `files`, `bin`, `engines`,
  `version`), `yarn.lock` and `README.md`.
- **Do NOT touch:** `backend/`, `frontend/`, `proxy/`, `crawler/`, `navi/`,
  `docker-compose.yml`, `dockerfiles/`, `.circleci/`, `scripts/` and `Makefile`, which belong to
  `backend`, `frontend`, `proxy`, `crawler`, `cache` or `infra`. Name the `infra`-owned client
  wiring explicitly: the `majora_client` service, the `client*` Makefile targets, the
  `client_tests`, `client_checks` and `client-release` jobs, and `scripts/bump_version.sh client`.
- **Tooling:** never run Node.js or yarn on the host. Use the `majora_client` service through
  `make client-install`, `make client-tests`, `make client-lint`, `make client-coverage` and
  `make client`, and note that they exist only once #1607 lands.
- **Rules from the spec:** no runtime dependencies (dev dependencies only); Node 20 or later;
  HTTPS only unless `--allow-insecure-http` is passed; authenticate with
  `Authorization: Bearer mjr_...` scoped tokens, not the legacy all-access `Token` used by
  `crawler/`.
- **Sources:** the client spec (`docs/agents/specs/client.md` and
  `docs/agents/specs/client/*.md`, especially `library.md`, `cli.md`, `packaging.md`,
  `scopes.md`); the API guides under `docs/guides/majora/` for request and response shapes; and
  `docs/agents/client.md`.
- **Naming:** `client/` is unrelated to `frontend/assets/js/client/` (`BaseClient`,
  `GameClient`, ...). That folder stays with `frontend`, and the two share no code.

## Files to Change

- `.claude/agents/client.md`: new agent definition.
