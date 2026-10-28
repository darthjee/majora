# Issue: Statistics bug: write the investigation specs

## Description

Part of Epic #1696 — investigate why navigating the site creates a new statistics `Session` for
a visitor that is already tracked (suspected on page refresh, when the frontend fires parallel
API requests).

Write the investigation specs in `docs/agents/specs/statistics-bug.md`, split into
`docs/agents/specs/statistics-bug/*.md`. The specs are the reference for every later sub-issue
of the Epic.

## Problem

Epic #1696 has several sub-issues (scope + export endpoint, frontend scope UI, version bump,
emulation and analysis scripts, findings, fix issue) that each need a shared, precise contract:
what the symptom is, which hypotheses to verify and how, what the export endpoint exposes and to
whom, how the scripts behave, and which privacy rules apply. Without written specs each sub-issue
would re-derive these, and the access-control contract would only be reviewed once code exists.

## Expected Behavior

- `docs/agents/specs/statistics-bug.md` exists as the index, registered in `docs/agents/specs.md`
  → *Active specs*, with a sub-issue table (number, title, page, status).
- Every aspect page listed in *Page layout* exists under `docs/agents/specs/statistics-bug/`, with
  `findings.md` as a placeholder.
- The export-endpoint page carries the access matrix used by #1699's tests.
- The pages pass markdownlint, contain no real production data or secrets, and are reviewed by
  the `data-access` and `security` agents.

## Solution

### Page layout

Modelled on `docs/agents/specs/loot-crawling.md` (short index + one page per aspect).

```text
docs/agents/specs/
├── statistics-bug.md                  # index
└── statistics-bug/
    ├── investigation-plan.md
    ├── symptom.md
    ├── hypotheses.md
    ├── export-endpoint.md
    ├── scripts.md
    ├── environments.md
    ├── privacy.md
    └── findings.md                    # placeholder
```

| Page | Content | Used by |
|---|---|---|
| `statistics-bug.md` (index) | One-paragraph problem statement, link to Epic #1696, list of aspect pages, and the sub-issue table (number, title, page, status) | all |
| `investigation-plan.md` | The two angles (code review + scripts), sub-issue order and dependencies, definition of done (root cause reproduced locally, evidence per hypothesis), where the version bump fits | #1696, #1704, #1705 |
| `symptom.md` | New `Session` vs. new `Visit`; how reuse/creation works today (cookie, IP/domain match, rotation on login in `_backfill_user`); legitimate new-session causes (other browser/device, private window, cleared cookies, logout, real IP change, cookieless bots) | #1702–#1704 |
| `hypotheses.md` | One entry per hypothesis — description, code involved, the emulation scenario and production pattern that would confirm it, status (open / confirmed / ruled out). Hypotheses: refresh + parallel requests (no-cookie race, login-rotation race, `Set-Cookie` ordering), IP change, domain mismatch, proxy/cache replaying `Set-Cookie`, cookie attributes | #1702–#1704 |
| `export-endpoint.md` | `statistics:read` scope rules (staff-only, read-only, family `statistics`), the access matrix (see *Permissions*), endpoint contract (route, params, pagination, date-range bound, fields, never the session `token`), `X-Skip-Cache` / no-private-cache / not warmed by Navi, no statistics tracking of its own requests, frontend wording | #1699, #1700 |
| `scripts.md` | `investigations/statistics-bug/` layout; `emulate.py` scenarios (incl. the refresh burst, `Set-Cookie` applied in arrival order); `analyse.py` device-authorization flow, grouping, classification, report format; cross-validation between the two | #1702, #1703 |
| `environments.md` | Local vs. production differences (proxy configuration, HTTPS / `SESSION_COOKIE_SECURE`, client-IP resolution, MySQL timestamp precision) and how a production-only cause is confirmed | #1702–#1704 |
| `privacy.md` | Token handling, git-ignored reports, anonymisation rules for anything committed; links to the investigator agent docs (#1698) instead of restating its rules | #1703, #1704 |
| `findings.md` | Placeholder heading, filled in by #1704 | #1704, #1705 |

Decisions:

- No separate code-review page: each hypothesis already names the code involved.
- The sub-issue status table lives only in the index; aspect pages link back to it.

### Scope boundaries

#### In scope

- `docs/agents/specs/statistics-bug.md` — a short index (modelled on
  `docs/agents/specs/loot-crawling.md`) linking every aspect page and the sub-issue of #1696 that
  implements it.
- Aspect pages under `docs/agents/specs/statistics-bug/`:
  - investigation plan (angles, sub-issue order, definition of done);
  - symptom (new `Session` vs. new `Visit`, legitimate new sessions);
  - hypotheses (each with how it is confirmed or ruled out);
  - export endpoint + `statistics:read` scope (contract for #1699 / #1700);
  - scripts (`emulate.py` / `analyse.py` design for #1702 / #1703);
  - environments (local vs. production differences);
  - privacy (token handling, reports, anonymisation);
  - `findings.md` placeholder, filled in by #1704.

#### Out of scope

- Any code — this sub-issue is documentation only (scripts, endpoints, agent file).
- Permanent docs changes: `token-scopes.md` belongs to #1699, the investigations docs and the
  `investigator` agent's rules to #1698. The specs only **link** to the investigator agent / its
  docs and do not restate its rules, so they live in one place.
- Investigating the bug: hypotheses are stated, not confirmed.

### Permissions

The export-endpoint / scope spec page must contain an **access matrix** that #1699's tests and the
reviews use as the single reference. Status codes follow what exists today: `require_staff`
(`backend/games/views/common.py`) returns 401 when unauthenticated and 403 `not_allowed` when not
admin/staff; scoped-token refusals (`backend/accounts/authentication.py`) return 401
`token_invalid` for a bad token and 403 (`ApiTokenForbidden` family, e.g. `token_not_allowed`,
missing scope) otherwise. "Staff" means admin or staff (`AdminOrStaffCache.is_admin_or_staff`).

| Caller | Export endpoint | Other staff statistics endpoints | `DELETE staff/statistics.json` (clear) |
|---|---|---|---|
| Anonymous | 401 | 401 | 401 |
| Invalid / revoked token | 401 `token_invalid` | 401 | 401 |
| Logged-in non-staff (browser) | 403 `not_allowed` | 403 | 403 |
| Staff (browser) | ✅ | ✅ (unchanged) | ✅ (unchanged) |
| Token without `statistics:read` | 403 (missing scope) | 403 `token_not_allowed` | 403 `token_not_allowed` |
| Token with `statistics:read`, non-staff owner | cannot exist (rejected at creation/approval); 403 `not_allowed` if it ever does | 403 | 403 |
| Token with `statistics:read`, staff owner | ✅ | 403 `token_not_allowed` | 403 `token_not_allowed` |

The page also specifies:

- **Granting:** token creation and device-authorization approval reject `statistics:read` for
  non-staff users with an explicit error (never silently stripped). The token's per-game list
  has no effect on it.
- **Frontend (#1700):** staff-only visibility of the scope is resolved through `RequestStore` /
  `RequestPermissionResolvers`, not a direct `AccessStore` call.
- **Review of the specs PR:** the `data-access` and `security` agents review this sub-issue's PR
  (not only #1699), checking the contract against `docs/agents/access-control/` and
  `docs/agents/security-guidelines.md` before any code exists.

### Performance & security considerations

The repository (`darthjee/majora`) is **public**: the specs, the findings and the issues are
readable by anyone.

#### Security (specs content and PR)

- **No real data or secrets:** no real IPs, user ids or session ids; no real token values
  (`mjr_...` placeholders only); the `X-Statistics-Skip-Secret` header is named but its value never
  appears; nothing from `.env` or the Render environment.
- **`findings.md` is public too:** #1704 commits only aggregated/anonymised evidence there, under
  the rules in `privacy.md`.
- **Internals only to the depth needed to fix the bug:** the specs describe what to verify, not
  how to abuse it (e.g. "a cached response may replay another visitor's `Set-Cookie`" is a
  hypothesis, without step-by-step session-hijack instructions).
- **Exploitable findings are reported privately first:** if the investigation confirms something
  exploitable (e.g. cookie/session leakage through the cache), #1704 reports it privately to the
  repository owner before any public write-up, and the specs/findings carry only what the owner
  approves.
- **Reviews:** the `security` and `data-access` agents review the specs PR.

#### Performance (requirements the specs set for later sub-issues)

- `export-endpoint.md`: maximum page size, date range bounded by
  `MAJORA_STATISTICS_MAX_RANGE_DAYS`, visits fetched in batches (no N+1), ordering on indexed
  columns, no statistics tracking writes caused by its own requests.
- `scripts.md`: `analyse.py` pages sequentially (never parallel) against production and starts
  with a narrow date range; the emulation's parallel bursts run only against the local stack.
- `investigation-plan.md`: the request hot path (`StatisticsSessionMiddleware`) is unchanged in
  this Epic.

### Specs lifecycle

Follows the precedent of #1686 / #1612 and the rules in `docs/agents/specs.md`.

- **Creation (#1697):** register the index in `docs/agents/specs.md` → *Active specs* (never
  directly in `AGENTS.md`).
- **During the Epic:** sub-issues update the pages when the implementation drifts from them;
  #1704 fills `findings.md`; hypothesis statuses are updated as they are confirmed / ruled out.
- **Removal:** a dedicated step of the **fix** work, after the post-fix check confirms the bug is
  gone:
  1. move durable knowledge into permanent docs — a short root-cause note and any clarified
     session-reuse rules into `docs/agents/statistics.md`; the scope/endpoint into the
     access-control docs (already done by #1699);
  2. unregister the index from `docs/agents/specs.md`;
  3. delete `docs/agents/specs/statistics-bug.md` and `docs/agents/specs/statistics-bug/`,
     together with `investigations/statistics-bug/`.
- **Dropped, not migrated:** hypotheses, scripts, environments, privacy (rules live in the
  investigator docs from #1698) and detailed findings — preserved by the fix issue and git history.

### Existing knowledge to build on

`docs/agents/statistics.md` already documents behavior the specs must reference:

- **Client IP integrity** — requests served through Tent's custom `BackendClient` handlers
  (`cache.php`, `delete.php`, `uploads.php`) **drop `X-Proxy-Secret` / `X-Forwarded-For`, so
  Django records Tent's IP** for them. Since a cookie-borne session is reused only when
  `session.ip` matches, mixing standard-rule and custom-handler requests during navigation (or a
  refresh) would flip the IP and create a new session each time. `hypotheses.md` lists this as a
  **top suspect**.
- **Tracking race** (#1683) and **Login is a visit boundary** — background for the symptom and
  rotation hypotheses.

### Edge cases

- **No real production data in the specs.** Examples use documentation-only values — IPs from
  RFC 5737 ranges (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) and made-up ids — never
  real IPs, user ids or session ids.
- **Pages describing things that don't exist yet** (the `investigator` agent, the export endpoint,
  the scripts) are marked as *planned by #<id>*, so a reader doesn't mistake them for existing
  behavior.
- **The spec drifts during implementation.** If #1699–#1703 have to deviate from the contract
  (endpoint fields, scope rules, script behavior), that sub-issue updates the relevant spec page in
  the same PR — the specs stay the source of truth until the Epic ends.
- **New hypotheses found later.** The hypotheses page is open: #1704 (or any investigation
  sub-issue) appends newly found causes rather than tracking them elsewhere.
- **Links into a temporary folder.** The specs are removed at the end of the Epic, so permanent
  docs (`AGENTS.md`, `docs/agents/**` outside `specs/`) must **not** link into
  `docs/agents/specs/statistics-bug/`; links go only from the specs outward.
- **Sub-issue references.** Pages reference sub-issues by number (stable), not by title; if a
  sub-issue is added, dropped or merged, the index is updated.
- **markdownlint** runs in CI: the new pages must pass it.

### Responsible agent

architect; data-access and security (review)

## Benefits

- One reviewed contract for every sub-issue of #1696, so implementation and investigation stay
  consistent.
- Access-control and privacy problems are caught at spec time, before any endpoint or script exists.
- A clear, public-safe record of the hypotheses and how each is verified, with a defined removal
  path once the bug is fixed.
