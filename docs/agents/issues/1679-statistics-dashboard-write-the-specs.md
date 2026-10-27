# Issue: Statistics dashboard: write the specs

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

Write the specs for the staff dashboard visits summary card. They go in an index at
`docs/agents/specs/statistics_dashboard.md` plus four topic pages under
`docs/agents/specs/statistics_dashboard/`, and the spec is registered in `docs/agents/specs.md`.
This issue is **documentation only**.

## Problem

The Epic #1678 is implemented by several independent sub-issues: #1682 (count endpoint), #1683
(tracking race), #1684 (clear endpoint) and #1685 (frontend card). They need one shared,
precise contract (URLs, params, payloads, status codes, permissions, UI states and edge cases)
to build against in parallel. Some design points are not settled yet (batching → #1680, audit
log → #1681), and the spec must make those gaps explicit rather than guess.

## Expected Behavior

- `docs/agents/specs/statistics_dashboard.md` (the index) and the four topic pages exist, and
  the index links to every page.
- The spec is registered under *Active specs* in `docs/agents/specs.md`.
- Every topic page follows the common template and is precise enough for its implementation
  issue to work from that page alone.
- Every open question is listed in the index's `## Open questions` and links to its issue (#1680,
  #1681, or a newly created sub-issue of #1678).
- No code, tests, config or translations change.

## Solution

### Scope

- **Specs only.** This issue writes the spec files and changes no code, tests, config or
  translations.
- **Open questions are listed, not resolved.** The index (`statistics_dashboard.md`) has an
  `## Open questions` section, and each affected topic page has a short "Open questions" note
  pointing to it. Every open question links to the **specific issue** that will settle it:
  - Batched clear strategy (batch size, order, locking, interaction with live tracking, the
    AUTO_INCREMENT reset step) → #1680.
  - Audit log for Clear (fields, level, destination, persisted or not) → #1681.
- **New open questions** found while writing the specs are not settled in this issue either.
  For each one, create a new issue (a sub-issue of #1678), then list and link it in the
  `## Open questions` section. Where a decision is still pending, the topic page states the
  pending point explicitly and does not guess.
- Out of scope: any implementation (#1682–#1685) and removing the specs (#1686).

### File naming

Keep the underscore names `docs/agents/specs/statistics_dashboard.md` and
`docs/agents/specs/statistics_dashboard/`, even though the existing `loot-crawling` spec uses
kebab-case. The topic files inside the folder use kebab-case (`count-endpoint.md`, etc.).

### Spec structure

**Index: `docs/agents/specs/statistics_dashboard.md`**

1. A short overview: the card on `/#/staff/dashboard` shows unique visitors for a rolling period
   (day, week or month), with Reload and Clear (a full wipe with ID reset), and links to
   `/#/staff/statistics`. The feature is **permanent**.
2. `## Aspect pages`: links to the four topic pages, in the style of `loot-crawling.md`.
3. `## Open questions`: each open question links to the issue that settles it (#1680 batched
   clear, #1681 audit log, plus any new ones; see *Scope*).
4. `## Sub-issues`: a table of #1679–#1686 with title, owning agent and dependencies, taken from
   the Epic #1678.

**Topic pages: `docs/agents/specs/statistics_dashboard/`.** There are four pages, and
cross-cutting concerns (permissions, `@restricted`, Tent and navi) are written **inline** in each
page, so every page maps 1:1 to its implementation issue:

| Page | Covers | Implemented by |
|---|---|---|
| `count-endpoint.md` | `GET` unique-visitors count endpoint | #1682 |
| `clear-endpoint.md` | `DELETE` clear endpoint, `statistics/reset.py`, ID reset, batching and audit log (open → #1680, #1681) | #1684 |
| `tracking-race.md` | visit tracking and user attachment tolerating a vanished session | #1683 |
| `dashboard-card.md` | the frontend card, typed `CLEAR` confirmation, i18n | #1685 |

**Common template:** every topic page uses these sections, in order:

1. **Purpose**: what the page covers and why.
2. **Contract**: URL, method, params, payload and status codes for endpoints; component, props,
   states and the endpoints it calls for the card.
3. **Behaviour**: the rules and algorithms.
4. **Permissions & caching**: who may call it, `require_staff`, `@restricted` / `X-Skip-Cache`,
   Tent (proxied, not cached), not in navi.
5. **Edge cases**
6. **Tests**: what the implementation must cover.
7. **Open questions**: pending points, each linking to its issue (or "None").
8. **Implemented by**: the issue number.

### Contracts

These contracts are settled here, and the topic pages must state them exactly.

#### Count endpoint (`count-endpoint.md`)

`GET staff/statistics/summary.json?period=<period>&tz=<IANA zone>`

- `period`: `day` | `week` | `month`, **default `day`** when missing. Any other value returns
  `400 {"errors": {"period": ["invalid_period"]}}`.
- `tz`: an IANA zone name, **default `UTC`**. An invalid value returns
  `400 {"errors": {"tz": ["invalid_timezone"]}}`, reusing the existing statistics params parsing.
  The card sends the browser's timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- Errors for several fields are combined in the same `errors` object, as the other statistics
  endpoints do.
- Rolling window, in local dates of `tz`, ending today: day = `[today, today]`, week =
  `[today − 6, today]`, month = `[today − 29, today]`.
- `200`, a flat payload:

  ```json
  {
    "period": "week",
    "from": "2026-10-21",
    "to": "2026-10-27",
    "tz": "America/Sao_Paulo",
    "unique_visitors": 42
  }
  ```

- `401` for anonymous callers and `403 {"errors": {"detail": ["not_allowed"]}}` for non-staff
  (`require_staff`).

#### Clear endpoint (`clear-endpoint.md`)

`DELETE staff/statistics.json`

- `200` with the deleted row counts:

  ```json
  { "deleted_visits": 1234, "deleted_sessions": 321 }
  ```

  The same counts are recorded in the audit log (#1681). The card can show them in its success
  status.
- `401` / `403` as above (`require_staff`). Methods other than `DELETE` return `405`.
- The response is sent only after the deletes and the ID reset have finished. The failure
  behaviour of a partial clear is part of the batching open question (#1680).

### Permissions

The spec states these rules on each affected page (in its *Permissions & caching* section):

- **Who:** staff or superuser only, for both the read and Clear. There is no separate,
  stricter rule for Clear.
- **Server side:** both endpoints call `require_staff` inline under
  `@permission_classes([AllowAny])` (401 for anonymous, `403 {"errors": {"detail":
  ["not_allowed"]}}` for non-staff), and both are `@restricted`.
- **Client side:**
  - The card lives on `/#/staff/dashboard`, which is already gated by `staffOrSuperuser`
    (`accessRouteConfig.js`), plus `AccessStore.ensureStaffOrSuperUser()` like the other staff
    statistics screens.
  - **Both calls go through `RequestStore`.** Add `GET.summary` (`/staff/statistics/summary.json`)
    and a `DELETE` entry (`/staff/statistics.json`) to
    `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` with `permission: null`
    (the `regular` and `private` variants point to the same object, mirroring the existing
    entries).
  - **No entry is added to `RequestPermissionResolvers.js`**, so it falls back to
    `NO_PERMISSIONS`, as for every other statistics endpoint. The clear uses `RequestStore.mutate`.
    The card does not use a dedicated client like `StaffCacheClient`.
- **Clear button visibility:** shown to everyone who can see the card. There is no extra
  client-side check; a server `403` is handled as a regular error state.
- **Data exposure:** the count endpoint returns only an aggregate number plus echoed params, no
  per-visitor or PII data. The clear response returns only row counts. The data-access and
  security agents should confirm this during review of #1682 / #1684.

### Edge cases

The spec's topic pages carry these in their *Edge cases* sections (and the related tests in
*Tests*).

**`count-endpoint.md`**

- **Consistency with `overview.json` (tested invariant):** for the same `from` / `to` / `tz`,
  `unique_visitors` must equal `overview.json`'s `totals.unique_visitors`. Both use the same
  visitor key (`VisitQuery.visitor_key`: logged-in visitors by user, anonymous visitors by
  session), the same rule that a visit counts when its `started_at` is inside the range, and the
  same `tz` local-day boundaries, including DST transitions. #1682 adds a test comparing the two
  endpoints.
- A visit that spans midnight counts on the day of its `started_at` only.
- `period` missing → `day`; invalid `period` or `tz` → 400 (see *Contracts*). A period with no
  visits → `unique_visitors: 0`.
- Requests carrying the statistics-skip header are not tracked, so they never appear in the
  count.

**`clear-endpoint.md`**

- The deleted counts include the Clear request's own visit and session.
- **Concurrent clears** (two staff users clicking Clear at the same time): listed under
  *Open questions* → #1680, together with batching and locking.
- **Failure partway through** (the batched deletes leave some rows): open question → #1680.
- Clearing an already-empty dataset returns `200 {"deleted_visits": 0, "deleted_sessions": 0}`.

**`tracking-race.md`**

- A session deleted between being loaded and its visit being tracked, and between tracking and
  user attachment: the error is swallowed, tracking is skipped, and the request never returns a
  500.
- Old cookies that point to a deleted session start a new session (existing behaviour; add a
  test).
- Right after a clear, the staff user who clicked it counts as 1 visitor (accepted behaviour).

**`dashboard-card.md`**

- **Typed confirmation:** the word is always `CLEAR`. It is not translated and is
  case-sensitive, and surrounding whitespace is trimmed. The translated modal text tells the user
  to type `CLEAR`. Cancelling or closing the modal clears the input.
- **Clear failure** (a 4xx other than validation, a 5xx, or a network error): show an error
  status, then **fetch the count again anyway**, because a partial clear may have happened.
- Clear success: show a success status that includes the deleted counts, then fetch the count
  again.
- The period select, Reload and Clear are disabled while any request is in flight, so a slower
  earlier response cannot overwrite a newer period's result.
- If the browser cannot resolve a timezone, the card omits `tz` (the server defaults to UTC).
- A `403` (for example a revoked staff role) is shown as the regular error state.

### Performance and security

**Performance**

- **Count:** a single SQL aggregate, `COUNT(DISTINCT <visitor key>)` over the `Visit` rows whose
  `started_at` is in the range, joined to `Session` for `user_id`. It uses the existing
  `Visit.started_at` index and **adds no new index**. #1682's tests check the query count (one
  aggregate query). An index or a different strategy is considered only if the query later proves
  slow.
- **No server-side caching** of the count: Reload must return fresh data, and the endpoint is
  `@restricted`.
- **Clear:** batched deletes. The batching and locking details are open → #1680.

**Security**

- **API tokens:** scoped API tokens cannot call `staff/` routes (`EXCLUDED_ROUTE_PREFIXES` in
  `backend/accounts/authentication.py`), so neither endpoint needs a `@token_scopes` declaration.
  The spec states this explicitly.
- **Authentication:** the endpoints use the standard token / cookie-token authentication, with
  JSON-only request bodies (`DELETE` sends no body).
- **No rate limiting** on Clear. It is staff-only, needs the typed confirmation, and is audited
  (#1681). Concurrency is handled in #1680.
- **Input validation:** only `period` (a fixed choice) and `tz` (validated against the IANA zone
  set by the existing parser) are accepted.
- **Data exposure:** aggregate counts only (see *Permissions*).

### Documentation touch points

- **#1679 (this issue):** register the spec under *Active specs* in `docs/agents/specs.md`,
  following the hub rule that it is registered there only, never in `AGENTS.md`.
- **#1682 / #1684:** update `docs/agents/access-control/staff-statistics.md` for their endpoint.
  The doc currently describes the staff statistics endpoints as read-only, which Clear changes.
- **#1686:** unregister the spec from `docs/agents/specs.md` when deleting the files.

## Benefits

- The implementation sub-issues can proceed in parallel against one agreed contract.
- Open design points are tracked in dedicated issues, not decided implicitly in code.
- One place to review the whole feature before implementation starts.
