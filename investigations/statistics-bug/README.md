# Statistics bug investigation

Temporary tooling for [Epic #1696](https://github.com/darthjee/majora/issues/1696): duplicated
statistics sessions. Issue #1702 adds `emulate.py`, which replays navigation scenarios against
the **local** stack and reports the statistics sessions and visits each scenario created, with
their tracking columns, flagging unexpected creation reasons. Issue #1703 adds `analyse.py`,
which reads the statistics export, groups the sessions that probably belong to one visitor and
classifies every extra session (see [analyse.py](#analysepy)).

Specs:

- [Scripts](../../docs/agents/specs/statistics-bug/scripts.md) — the contract of `emulate.py`.
- [Hypotheses](../../docs/agents/specs/statistics-bug/hypotheses.md) — what each scenario tests.
- [Tracking columns](../../docs/agents/specs/statistics-bug/tracking-columns.md) — creation
  reasons.
- [Export endpoint](../../docs/agents/specs/statistics-bug/export-endpoint.md) — export and
  device authorization.
- [Privacy](../../docs/agents/specs/statistics-bug/privacy.md).

This folder is **temporary**: it is deleted once the bug is fixed, after any durable knowledge
moves to `docs/agents/`.

## Prerequisites

- The local stack is up (`majora_proxy`, `majora_app`, `majora_mysql`, `majora_fe`), started
  from the root `docker-compose.yml`.
- A **local** staff user who can approve the device authorization in the local frontend.
- The root `.env` holds the local secrets:
  - `STATISTICS_SKIP_SECRET` — lets the script's own reads skip tracking;
  - `PROXY_SECRET` — needed only by the IP change scenario (it must match the backend's and
    Tent's `PROXY_SECRET`). Without it that scenario is reported as skipped.

  Their values are read from the environment only; they are never copied here, printed or
  logged. To pass one from the shell instead, use `run -e NAME`.

## Network

The service joins the project's Docker network as an external network. With the repository in a
folder named `majora`, the root compose file creates `majora_default` (check with
`docker network ls`). Override it with `MAJORA_DOCKER_NETWORK` when the folder has another
name:

```bash
MAJORA_DOCKER_NETWORK=myfolder_default docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate
```

## Run

From the repository root:

```bash
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate
```

**Do not browse the local site during a run.** Every scenario reads back the sessions created
during its own time window; your browser's requests would be counted as the scenario's.

## Environment variables

All optional unless noted; secrets and passwords are read from the environment only (root
`.env` or `run -e NAME`), never committed, printed or logged.

| Variable | Use |
|---|---|
| `STATISTICS_SKIP_SECRET` | **Required.** Sent by the script's own requests (authorization, export, setup) so they are not tracked. |
| `MAJORA_USERNAME` (or `--username`) | **Required for a real run.** Local staff username or e-mail that approves the device authorization. |
| `MAJORA_LOGIN_USERNAME` / `MAJORA_LOGIN_PASSWORD` | A local test user for the logged-in scenarios; without them those scenarios are skipped. |
| `PROXY_SECRET` | The IP change scenario (must match the backend's); skipped without it. |
| `MAJORA_GAME_SLUG` | Game used by the game-page calls; defaults to the first game of `GET /games.json`. |
| `MAJORA_BASE_URL`, `MAJORA_BACKEND_URL`, `MAJORA_HOST`, `MAJORA_APPROVAL_URL` | Local targets (defaults: `http://majora_proxy`, `http://majora_app:8080`, `localhost:3000`, the local authorization requests page). Non-local hosts are refused; there is no override. |
| `MAJORA_DOCKER_NETWORK` | The project's Docker network (default `majora_default`). |

Other flags: `--scenario NAME` (repeatable) runs only some scenarios; `--dry-run` validates the
configuration and secrets without sending anything.

## Scenarios

Scenarios run sequentially, each with a fresh cookie jar. A scenario's setup (for example
getting a cookie first) runs before its time window; the script pauses 2.5 seconds between a
setup and its window and between scenarios, so the one-second window slack never captures
another scenario's sessions.

| Scenario | Hypothesis | Expected |
|---|---|---|
| `first_visit` | — | one `no_cookie` session |
| `sequential_navigation` | — | the same session reused; no new session |
| `refresh_burst_no_cookie_anonymous` | 2a | one `no_cookie` session per parallel request reaching the backend (5) |
| `refresh_burst_with_cookie_anonymous` | 2c | the existing session reused |
| `refresh_burst_with_cookie_logged_in` | 2b | at most one `login_rotation` session |
| `mixed_handlers` | 1 | no new session (an `ip_changed` session confirms hypothesis 1) |
| `login_mid_navigation` | 2b | one `login_rotation` session |
| `ip_change` | 3 | one `ip_changed` session |
| `host_change` | 4 | one `domain_changed` session |

Notes:

- **Browser:** the jar applies `Set-Cookie` in response **arrival** order; each request of a
  burst carries the jar as it was when the burst started. A slower response can therefore
  overwrite a newer cookie (hypothesis 2c).
- **Logged in** means the frontend's `Authorization: Token <token>` header. In
  `refresh_burst_with_cookie_logged_in` the token comes from an untracked side login, so the
  jar keeps its anonymous statistics cookie (the frontend still holds a token after the cookie
  was reset).
- **Mixed handlers** only sends anonymous requests the backend refuses, or reads:
  `GET /staff/cache/size.json` (`rules/cache.php`), `DELETE /games/<slug>/pcs/0/photos/0.json`
  (`rules/delete.php`, id `0` never exists) and `POST /uploads/image/0/submit`
  (`rules/uploads.php`). The cache-clear route is never called. Without `PROXY_SECRET` on Tent
  and the backend every request records the proxy IP, so no IP flip can show.
- **IP change:** Tent's `SetClientIpMiddleware` overwrites `X-Forwarded-For`, so this scenario
  talks to the backend directly with `X-Proxy-Secret` and `X-Forwarded-For` from the RFC 5737
  ranges (`192.0.2.10`, then `198.51.100.20`).
- **Host change:** `localhost:3000`, then `127.0.0.1:3000` (both in the local `ALLOWED_HOSTS`).
  Django sets the statistics cookie host-only, so a browser would not send it to the second
  host: the jar carries it on purpose. At least one of the two hosts must be a registered local
  `Domain`, otherwise both resolve to no domain and the session is reused (the report says so).
- Expectations that turn out wrong are flagged, not adjusted: a mismatch is evidence.

## Refresh-burst request list

A refresh of a game page (`#/games/<slug>`) fires these calls at once (`REFRESH_BURST` in
`emulate.py`), read from `frontend/assets/js/`:

| Call | Source |
|---|---|
| `GET /access-route-config.json` | `components/AppController.js` (constructor → `AccessRouteConfigStore.load()`), `client/AccessRouteConfigClient.js` |
| `GET /users/header_status.json` (`X-Skip-Cache`) | `components/common/header/controllers/HeaderController.js` (`checkStatus`), `client/AuthClient.js` |
| `GET /domain/config.json` | `HeaderController.js` (`fetchDomainConfig`), `client/DomainClient.js` — a Tent static rule, never reaches Django |
| `GET /games/<slug>.json` | `components/resources/game/pages/controllers/GameController.js` (`RequestStore` `game`) |
| `GET /games/<slug>/access.json` (`X-Skip-Cache`) | `GameController.js` → `AccessStore.ensureGameAccess`, `client/GameClient.js` |
| `GET /permissions/game.json` (`X-Skip-Cache`) | `GameController.js` → `AccessStore.ensureGamePermissions`, `client/GameClient.js` |

`X-Skip-Cache` follows `client/BaseClient.js` (`#shouldSkipCache`) and
`client/config/skipCacheEndpoints.js`. Simplification: in the browser the access and
permissions calls start once the game call resolves; the burst fires them together with the
others, which is the worst case for the race.

## Reports

Each scenario's window is exported right after the scenario runs. A run writes, in the
git-ignored `reports/` folder:

- `emulate-<timestamp>.json` — machine-readable; the input `analyse.py` (#1703) is validated
  against. Per scenario: `status` (`MATCH` / `MISMATCH` / `SKIPPED`), `expected`, `actual`
  (creation reason counts, `null` for none), `mismatches`, `notes`, the `window` (and the
  widened range actually filtered), the `requests` sent (masked paths, status, arrival order,
  send/arrival offsets in ms, whether the response set the statistics cookie) and the
  `sessions` created in the window: `id`, `ip`, `domain`, `user_id`, `created_at`,
  `last_seen_at`, `creation_reason`, `first_path`, `first_seen_logged`, `visit_count`,
  `visits_truncated` and `visits` (`started_at`, `last_seen_at`, `hits`, `first_path`,
  `last_path`). It also holds the self-pollution checks.
- `emulate-<timestamp>.txt` — the text summary also printed to stdout: one line per scenario
  (`expected -> actual`), its mismatches (`!`), its sessions (reason, `first_path`, logged,
  visit count) and notes. It shows no IP, id, token or secret.

How to read it:

- `MISMATCH` is a **finding**, not a failure: compare it with the scenario's hypothesis in
  [Hypotheses](../../docs/agents/specs/statistics-bug/hypotheses.md).
- **Window:** the export's timestamps are whole seconds, so sessions are kept when their
  `created_at` falls in the scenario window widened by one second on each side (the 2.5-second
  pauses keep neighbouring scenarios out).
- **Self-pollution:** the script's own requests (authorization create/poll, export, setup
  login, game discovery) send `X-Statistics-Skip-Secret`. The report checks that no session or
  visit inside the authorization window, and the whole run, was opened on the script's own
  routes (`authorization` and `run`).

Exit codes: `0` the run completed (whatever the matches); `2` refused (non-local target,
missing secret or username, unknown scenario); `3` authorization denied or expired, or export
refused (no report); `4` the local stack is unreachable (no report).

The JSON report holds local IPs and ids: it stays in `reports/`. Anything copied from a report
into the repository or an issue is aggregated or anonymised (see the Privacy spec).

## analyse.py

Reads the statistics export (`GET /staff/statistics/export.json`) for a date range, groups the
sessions that probably belong to the same visitor and classifies every extra session of a group.
Standard library only; it runs through this folder's compose file like `emulate.py`.

### Safety

- **Read-only.** Its only requests are the device-authorization create (`POST`) and poll, and
  the export pages, fetched **sequentially** (`per_page` 100). Any other method is refused.
- **Targets.** Without `--production` every URL must be local (same list as `emulate.py`).
  With `--production` the only target is `STATISTICS_PROD_URL` from the root `.env` (https,
  never an argument value, never printed). Any other host is refused; there is no override.
- **Secrets.** `STATISTICS_SKIP_SECRET` is optional and only sent to local targets, never to
  production.
- **Token.** The `statistics:read` token is kept in memory only: never printed, logged or
  written. At the end the script reminds you to revoke it from your account page (API tokens);
  it does not revoke it itself.
- **Clean stop.** A denied or expired authorization, or a token rejected later (401
  `token_invalid`: revoked or expired), stops the run with **no partial report** (exit 3).

### Commands

From the repository root. `--from` / `--to` (`YYYY-MM-DD`) are **required**; there is no
default range, so every run is deliberate and narrow.

```bash
# local export (the local stack must be up)
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm analyse \
  --from 2026-01-01 --to 2026-01-01 --username <local staff user>

# validation against an emulate.py report (local only)
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm analyse \
  --from <day> --to <day> --username <local staff user> \
  --validate reports/emulate-<timestamp>.json

# production (#1704 only)
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm analyse-prod \
  --from <day> --to <day> --username <staff user>
```

The **production run belongs to #1704**: it needs the user's go-ahead, their approval of the
token, and enough data collected after the #1701 release. `analyse-prod` adds `--production`
itself and stays off the local Docker network.

Options: `--tz` (default `UTC`), `--domain` (a `Domain` id or `unknown`), `--race-window`
(seconds, default 2), `--username` / `MAJORA_USERNAME`, `--reports-dir` (default `reports`),
`--anonymised` (also print the anonymised summary) and `--dry-run` (validate the configuration
only; it says whether the production URL is present, never what it is).

### Authorization

The script creates a device-authorization request asking for `statistics:read` only, prints
the approval link (`<site>/#/account/authorization_requests`) and polls every 3 seconds. It has
no timeout of its own: it waits until the request is approved, denied or expires, **1 hour**
after creation on the server.

**Production side effect:** the export route is untracked, but the authorization create and
poll requests are tracked like any client, so they open a few statistics sessions. Those
sessions (`first_path` on the script's own routes) are removed from the analysis and counted as
"self sessions (authorization side effect)". Locally, with the skip secret, that count is 0.

### Analysis

- **ID resets (#1684):** walking the sessions by `id`, a `created_at` going back by more than
  the race window marks a statistics Clear; the data is split there and each segment is
  analysed separately. A reset is a warning, not a failure.
- **Grouping:** the same `user_id` (high confidence); anonymous sessions on the same domain and
  IP, each created within the race window of the previous one or during its activity (low
  confidence: unrelated visitors behind the same NAT can share an IP); and links read from the
  creation reason (`ip_changed` to a nearby IP, /24 or /64, on the same domain;
  `domain_changed` from the same IP; a login rotation to the anonymous session it came from).
  The first session of a group (by `created_at`, then `id`) is the original; the others are
  extras.
- **Classification of each extra:** `race`, `login_rotation`, `ip_change`, `domain_change`,
  `single_hit_orphan`, `legitimate` (a fresh start more than 30 minutes after the visitor went
  quiet, or a bot-like session on `unresolved` paths only) or `other`. `creation_reason` is the
  primary signal: the heuristic is cross-checked against it and every disagreement is reported.
  Sessions with `NULL` tracking columns (before #1701) use the heuristics only and are counted
  in a separate pre-columns bucket.

### Reports

A run writes `analyse-<timestamp>.json` / `.txt` to the git-ignored `reports/` folder: the
range and target kind (never the production URL), totals (sessions, groups and extras by
confidence, self sessions removed, ID resets), counts per cause and per `creation_reason`, per
domain, anonymous vs. logged in and per `first_seen_logged`, the top 10 `first_path` values per
`creation_reason`, the disagreements, the pre-columns bucket and up to 5 sample groups per cause
with each visit's `first_path` / `last_path`.

The files keep raw values (IPs, ids): they stay in `reports/`. The **console** shows counts and
breakdowns only. The **anonymised summary** (`--anonymised`, also at the end of the `.txt`)
masks IPs (`203.0.113.x`), replaces session, user and domain ids with per-run aliases (`s-1`,
`user-1`, `domain-1`) and shows paths only as counts: it is the only part safe to paste into an
issue or a PR.

### Validation mode

`--validate <emulate report.json>` (local only; refused with `--production`) authorizes once,
then, for every scenario that was not skipped, reads the local export for the scenario's window
(`window.filtered_from` / `filtered_to`, `tz=UTC`, filtered by `created_at`) and analyses those
sessions only. Per scenario it checks that:

- the analysed session ids equal the scenario's `sessions`;
- the extras found equal the scenario's session count minus 1, all in one group (a scenario is
  one visitor);
- the recovered `creation_reason` counts satisfy the scenario's `expected` (same rule as
  `emulate.py`), with no disagreement;
- with the skip secret, no session was opened by the script's own routes.

It prints one `match` / `mismatch` line per scenario and writes `validate-<timestamp>.json` /
`.txt` to `reports/`. Exit codes: `0` every scenario matches, `1` a mismatch, `2` refused, `3`
authorization or export failed (no report), `4` network failure (no report).

A mismatch inherited from `emulate.py` (a scenario producing an unexpected reason) is a finding
for #1704, not something to tune away.
