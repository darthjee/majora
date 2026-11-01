# Issue: Statistics bug: production data analysis script

## Description

Part of Epic #1696: find out why navigating creates a new statistics `Session` for a visitor who
is already tracked. This sub-issue adds the **production data analysis** script, `analyse.py`,
to `investigations/statistics-bug/`, following `docs/agents/specs/statistics-bug/` (mainly
`scripts.md`, `export-endpoint.md` and `privacy.md`) and the rules in
`docs/agents/investigator.md`.

## Solution

### Where it lives

- `investigations/statistics-bug/analyse.py`, next to `emulate.py` (#1702).
- It runs through the folder's standalone `docker-compose.yml`, the same way as `emulate.py`.
- Reports go to the folder's git-ignored reports location.
- The CI exclusions for `investigations/**` come from #1702; nothing new is needed.

### Command line

- `--from` / `--to` are **required**. There is no default range, so every run, especially
  against production, is deliberate and narrow. `--tz` and `--domain` are optional.
- `--base-url` (or the environment) picks the target:
  - local: the compose service names, `localhost` or `127.0.0.1`;
  - production: read from `.env` (for example `STATISTICS_PROD_URL`). It is never hardcoded or
    committed.
- `--race-window` (seconds) sets the parallel-race window. Default: 2.
- `--validate <emulate report.json>` turns on validation mode (see below).

### Authorization

- Gets a `statistics:read` token through the device-authorization flow:
  1. create a request with `scopes: ["statistics:read"]` at `users/authorization_requests.json`;
  2. print the approval link;
  3. poll every few seconds.
- It has no time limit of its own: it waits until the request's own expiry, which is 1 hour on
  the server.
- If the request is denied or expires, or the token is rejected later (revoked or expired), the
  script stops cleanly and writes **no partial report**.
- The token is kept in memory only. It is never written to disk, printed or logged.
- When the script finishes, it reminds the user to revoke the token from their account page.
  The script does not revoke it.

### Fetching (read-only)

- Pages through `GET /staff/statistics/export.json` **sequentially**, never in parallel, for the
  given range and optional domain (`per_page` 100).
- It makes no writes.
- Its own requests create no sessions: the export route is untracked. This is verified on local
  data, not assumed.

### Grouping

Groups the sessions that probably belong to the same visitor:

- same `user_id`: high confidence;
- same domain, same or nearby IP and close timestamps: low confidence. Unrelated visitors behind
  NAT can share an IP, and the report says so.

### Classification

Each extra session in a group is classified as one of:

- a parallel-request race;
- a login rotation;
- an IP change;
- a domain change;
- a single-hit orphan;
- legitimate (logout, bots and so on; see `symptom.md`);
- other.

Rules:

- **Timestamps are whole seconds.** A race is: same domain, same IP, `created_at` no more than
  `--race-window` seconds apart. Within the same second, sessions are ordered by `id`.
- **`creation_reason` is the primary signal** where present. The heuristics are cross-checked
  against it, and every disagreement is reported.
- Sessions with `null` tracking columns (created before the #1701 release) fall back to the
  heuristics only and are counted separately.

### ID reset (#1684)

- A statistics clear inside the range shows up as session ids going **down** while `created_at`
  goes up.
- The script warns and splits the analysis at that point. It does not fail.

### Report

The report is written as text and as JSON, and is git-ignored. It contains counts:

- per cause and per `creation_reason`;
- per domain;
- anonymous vs. logged in, and per `first_seen_logged`;
- the top `first_path` values per reason, aggregated, for example which API endpoint creates the
  duplicate sessions of a refresh burst.

It also contains:

- the heuristic vs. `creation_reason` disagreements;
- the ID-reset warnings;
- sample groups, including each visit's `first_path` / `last_path`.

Anything copied into the repository, an issue or a PR is aggregated or anonymised: masked IPs
such as `203.0.113.x`, and no user ids, session ids or raw paths.

### Validation mode

`--validate <emulate report.json>`:

- reads each scenario's time window and expected creation reasons from `emulate.py`'s JSON
  report;
- analyses the **local** export for each window;
- reports, per scenario, the duplicates it found against the duplicates the scenario produced,
  and the reasons it recovered against the reasons expected.

Exit code is 0 if every scenario matches, 1 otherwise. Validation mode refuses a non-local base
URL.

### Out of scope

- The **production run**. It belongs to #1704. It needs the user's go-ahead, approval of the
  token, and enough data collected after the #1701 release.
- Any change to application code (`backend/`, `frontend/`, `proxy/`, …).

### Depends on

- `emulate.py` and the investigation folder (#1702). Validation needs it merged.
- The tracking columns (#1712, #1713) and the export endpoint (#1699).
- Scoped device authorization (#1708).

### Testing

- Run `emulate.py` locally, then `analyse.py --validate` on its report. Every scenario must
  match.
- Confirm the script's own requests created no sessions.
- Confirm that `--from` / `--to` are required, and that validation mode refuses a production
  base URL.
- Confirm a denied or expired authorization stops the script cleanly with no report.

### Responsible agents

**investigator**.
