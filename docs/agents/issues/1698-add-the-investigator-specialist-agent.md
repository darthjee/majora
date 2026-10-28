# Issue: Add the investigator specialist agent

## Description

Part of Epic #1696 (statistics session investigation). Add a new **permanent, generic**
specialist agent, `investigator`, responsible for temporary investigation tooling. The
statistics bug (#1702–#1704) is its first user, but the agent outlives it. Precedent: #1601
added the `client` agent the same way (agent file, docs page, roster and index entries).

## Problem

The Epic needs scripts that read production statistics data and emulate navigation against the
local stack. That tooling does not fit any existing agent: it is not application code
(`backend`, `frontend`, `proxy`, `client`), not infrastructure (`infra`), and it handles
production data, so it needs its own explicit safety rules. It also introduces a new top-level
folder, `investigations/`, which needs a named owner.

## Expected Behavior

- `.claude/agents/investigator.md` exists and the architect can delegate investigation work
  to it.
- The agent's scope, ownership boundaries and safety rules are documented and discoverable from
  `AGENTS.md` and the architect's roster.

## Solution

### Scope of the agent

- **Owns** `investigations/<topic>/` folders at the repo root: standalone, temporary
  investigation tooling (scripts, their own `docker-compose.yml`, `README.md`, a local
  `.gitignore` for reports). Generic: reusable for future investigations, not only
  `statistics-bug`.
- Also takes part in investigation analysis (code review, findings write-up) alongside the
  architect, as in #1704. It may **read** any application code (e.g. `backend/statistics/`,
  `proxy/`) for that review, but never edits it.

### Ownership boundaries

- **`investigator`** owns everything inside `investigations/<topic>/`, including its own
  `docker-compose.yml` and `.gitignore`.
- **`infra`** owns anything outside the folder that touches it (root `.gitignore`, CI changes).
- No Makefile targets: investigations run with
  `docker-compose -f investigations/<topic>/docker-compose.yml ...`.

### Rules it follows

- Production data is **read-only** and accessed only after explicit authorization by the user
  (e.g. the device-authorization flow with a scoped token the user approves).
- Tokens are kept in memory only; never written to disk, logs or reports.
- Reports/outputs are git-ignored inside the investigation folder.
- The repo is public: anything committed (findings, issues, docs) is aggregated or anonymised —
  no real IPs, user IDs, session IDs, token values or secret values.
- Exploitable security findings are reported privately to the repo owner before any public
  write-up.
- Emulation runs only against the local stack, never production.
- Investigation folders are temporary: deleted once their investigation is solved.
- Never touches application code (`backend/`, `frontend/`, `proxy/`, `client/`,
  `crawler/`, `navi/`) — changes there are delegated to the owning specialist.
- Runs everything through docker-compose (no host runtimes), per the project rules.

### Deliverables

- `.claude/agents/investigator.md` (frontmatter `name`, `description`, `tools: Read, Edit,
  Write, Bash` — no `Agent`; it hands work to other agents through the architect), matching the
  other agents' shape.
- `docs/agents/investigator.md` (named after the agent, like `client.md` and `crawler.md`)
  describing the agent and investigations, linked from the `AGENTS.md`
  documentation index and `docs/agents/summary.md`.
- Agent listed in the architect's roster table and docs table (`.claude/agents/architect.md`).
- `investigations/` listed in `docs/agents/folder-structure.md` ("not created yet —
  scaffolded by #1702; owned by the `investigator` agent").

### Responsible agent

architect

## Benefits

- Investigation tooling gets a clear owner and written safety rules before any script touches
  production data.
- The agent is reusable for future investigations.
