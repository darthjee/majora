# Investigator Agent

## Why it exists

Some bugs can only be diagnosed by looking at production data or by replaying real navigation.
That tooling is neither application code (`backend`, `frontend`, `proxy`, `client`, `crawler`)
nor infrastructure (`infra`), and because it touches production data it needs explicit safety
rules. The `investigator` specialist agent (`.claude/agents/investigator.md`) owns that tooling.

The agent is permanent and generic. Epic #1696 (statistics session investigation) is its first
user, but it serves any future investigation.

## Investigation folders

Each investigation lives in its own folder at the repository root, `investigations/<topic>/`
(for example `investigations/statistics-bug/`):

- the investigation scripts
- its own `docker-compose.yml`, run with
  `docker-compose -f investigations/<topic>/docker-compose.yml ...` — there are no Makefile
  targets and no root docker-compose service
- a `README.md` describing the investigation and how to run it
- a local `.gitignore` that keeps reports and outputs out of git

Investigation folders are excluded from CI and are temporary: a folder is deleted once its
investigation is solved, and any durable knowledge is moved to the relevant `docs/agents/` page
first. The exclusion is declared in two places: the `ignores` list of
`.markdownlint-cli2.jsonc` and the top-level `exclude_paths` of `.codacy.yml`, both with the
glob `investigations/**`; the other CI jobs are scoped to `backend/`, `frontend/`, `client/`, `proxy/` or
`crawler/navi-extension/` and never see the folder.

The agent also takes part in the analysis (code review, findings write-up) alongside the
architect.

## Ownership boundaries

- **`investigator`** owns everything inside `investigations/<topic>/`, including its own
  `docker-compose.yml` and `.gitignore`.
- **`infra`** owns anything outside the folder that touches it, such as the root `.gitignore`
  or CI changes.
- **Application code** stays with its specialists. The investigator may read any of it
  (`backend/`, `frontend/`, `proxy/`, `client/`, `crawler/`, `navi/`) for reviews, but never
  edits it; changes there are delegated to the owning specialist through the architect.

## Safety rules

These are the reference rules; the agent file repeats them.

- Production data is **read-only**, and is accessed only after explicit authorization by the
  user (for example the device-authorization flow with a scoped token the user approves; see
  [Token scopes](access-control/token-scopes.md)).
- Tokens are kept in memory only, never written to disk, logs or reports.
- Reports and outputs are git-ignored inside the investigation folder.
- The repository is public: anything committed (findings, issues, docs) is aggregated or
  anonymised — no real IPs, user IDs, session IDs, token values or secret values.
- Exploitable security findings are reported privately to the repository owner before any
  public write-up (see [Security Guidelines](security-guidelines.md)).
- Emulation runs only against the local stack, never against production.
- Everything runs through docker-compose; no language runtime runs on the host.
