# Issue: Statistics bug: investigation folder and navigation emulation script

## Description

Part of Epic #1696: find out why navigating creates a new statistics `Session` for a visitor who
is already tracked. This sub-issue creates the temporary investigation folder and the
**navigation emulation** script, following `docs/agents/specs/statistics-bug/` (mainly
`scripts.md` and `hypotheses.md`) and the rules in `docs/agents/investigator.md`.

## Solution

### Folder

`investigations/statistics-bug/` is temporary and is deleted once the bug is fixed. It holds:

- `README.md`: what the investigation is, how to run it, the warning below, and where the
  refresh-burst request list came from;
- `emulate.py`;
- a standalone `docker-compose.yml`, run with
  `docker-compose -f investigations/statistics-bug/docker-compose.yml ...`. It has no Makefile
  target and no root service, and joins the project network so it can reach the proxy and the
  backend;
- a `.gitignore` that keeps generated reports out of git.

### CI exclusion

- markdownlint ignores `investigations/**`.
- `.codacy.yml` excludes `investigations/**`.
- ruff, pytest and Jasmine already only look inside their own folders. Confirm this; change
  nothing there.

### `emulate.py`: safety

- Runs against the **local** stack only. A base URL that is not on a local allowlist
  (`localhost`, `127.0.0.1`, the compose service names) is refused.
- **Token:** gets a `statistics:read` token through the device-authorization flow (#1708). It
  creates a request with `scopes: ["statistics:read"]`, prints the approval link, and waits
  while a local staff user approves it in the local frontend. It then polls for the `mjr_`
  token, which is kept in memory only. If the request is denied or expires, the script stops
  cleanly and writes no report.
- **Local secrets:** `PROXY_SECRET` and `STATISTICS_SKIP_SECRET` are read from the local `.env`
  or the environment. They are never hardcoded, printed or logged.
- **Self-pollution:** the script's own requests (device authorization, export) send the
  statistics skip header, so they create no sessions or visits. The script verifies this rather
  than assuming it.

### `emulate.py`: browser emulation

- Goes through the proxy, so proxy and cache behaviour are included.
- Keeps a browser-like cookie jar that applies `Set-Cookie` in **response arrival order**.

### Scenarios

Each scenario maps to a hypothesis.

- First visit.
- Sequential navigation.
- **Page refresh burst:** the same parallel API requests the frontend fires when a page loads
  (for example a game page). The list comes from the frontend code at implementation time and
  its source is noted in the README. It runs with and without an existing cookie, anonymous and
  logged in (hypotheses 2a, 2b, 2c).
- **Mixed handlers:** standard-rule requests mixed with requests served by Tent custom handlers
  (`cache.php`, `delete.php`, `uploads.php` routes), with one cookie jar (hypothesis 1, the top
  suspect).
- Login mid-navigation (hypothesis 2b).
- **IP change** (hypothesis 3):
  - Tent's `SetClientIpMiddleware` overwrites any incoming `X-Forwarded-For`, so this scenario
    cannot be emulated through the proxy.
  - Its requests go **directly to the backend** with `X-Proxy-Secret` (local `.env`) and a
    made-up `X-Forwarded-For` (documentation ranges, not real IPs).
  - Every other scenario goes through the proxy.
- **Host change:** the same local stack is reached under two local host names, for example
  `localhost` and `127.0.0.1` (hypothesis 4). The plan checks which names are allowed locally.

### Isolation and report

- Scenarios run **sequentially**. Each records its start and end time, and its rows are the
  sessions and visits created inside that window, read through the local `statistics:read`
  export endpoint. Nothing is deleted.
- The README warns not to browse the local site during a run.
- The report comes out as text and as JSON. It is git-ignored, so `analyse.py` (#1703) can be
  validated against known outcomes.
  - Per session it includes `creation_reason`, `first_path` and `first_seen_logged`.
  - Per visit it includes `first_path` and `last_path`.
- Each scenario declares the creation reasons it expects, and the report flags any mismatch:
  - IP change → `ip_changed`;
  - host change → `domain_changed`;
  - login mid-navigation → `login_rotation`;
  - refresh without a cookie → one `no_cookie` session per parallel request.

### Out of scope

- Any change to application code (`backend/`, `frontend/`, `proxy/`, …).
- Production access.
- `analyse.py` (#1703).

### Depends on

- Specs (#1697) and the `investigator` agent (#1698).
- `statistics:read` and the export endpoint (#1699).
- Scoped device authorization (#1708).
- The tracking columns (#1712, #1713).

All of these are merged.

### Testing

- Run every scenario locally and check that the report shows the expected creation reasons, or
  flags and explains each mismatch.
- Confirm the script's own requests created no sessions.
- Confirm that a production base URL is refused.

### Responsible agents

- **investigator** owns everything inside `investigations/statistics-bug/`.
- **infra** owns the markdownlint and Codacy exclusions.
