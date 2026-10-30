# Statistics bug investigation

Temporary tooling for [Epic #1696](https://github.com/darthjee/majora/issues/1696): duplicated
statistics sessions. Issue #1702 adds `emulate.py`, which replays navigation scenarios against
the **local** stack and reports the statistics sessions and visits each scenario created, with
their tracking columns, flagging unexpected creation reasons.

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
