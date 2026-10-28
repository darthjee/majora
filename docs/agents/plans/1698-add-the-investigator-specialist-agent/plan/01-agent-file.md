# Agent file

Create `.claude/agents/investigator.md`, matching the shape of `.claude/agents/client.md`.

- Frontmatter: `name: investigator`; `description` along the lines of "Majora investigator
  specialist. Use for investigation tooling inside `investigations/<topic>/` — temporary,
  standalone scripts that read production data (read-only, user-authorized) or emulate
  navigation locally to diagnose a bug — and for investigation code reviews and findings.";
  `tools: Read, Edit, Write, Bash` (no `Agent`: other agents are reached through the architect).
- **Your scope**: everything inside `investigations/<topic>/` — scripts, its own
  `docker-compose.yml`, `README.md`, a local `.gitignore` for reports. Also code review and
  findings write-ups alongside the architect. Read access to any application code for reviews.
- **Do NOT touch**: `backend/`, `frontend/`, `proxy/`, `client/`, `crawler/`, `navi/`, root
  `docker-compose.yml`, `dockerfiles/`, `.circleci/`, `scripts/`, `Makefile`, root `.gitignore`
  — those belong to their specialists; `infra` owns any wiring outside the investigation folder.
- **Tooling**: never run runtimes on the host; use
  `docker-compose -f investigations/<topic>/docker-compose.yml ...`. No Makefile targets.
- **Rules**: production data read-only and only after explicit user authorization (e.g. the
  device-authorization flow); tokens in memory only, never on disk, logs or reports; reports
  git-ignored inside the folder; public repo — committed content aggregated/anonymised (no real
  IPs, user IDs, session IDs, token or secret values); exploitable findings reported privately to
  the repo owner before any public write-up; emulation only against the local stack; folders
  deleted once their investigation is solved.
- **Sources**: link `docs/agents/investigator.md`, `docs/agents/security-guidelines.md`,
  `docs/agents/access-control/token-scopes.md`.

## Files to Change

- `.claude/agents/investigator.md` — new agent definition.
