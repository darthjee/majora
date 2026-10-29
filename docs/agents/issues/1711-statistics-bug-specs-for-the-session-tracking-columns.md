# Issue: Statistics bug: specs for the session tracking columns

## Description

Part of Epic #1696 (statistics session investigation). To read *why* a new statistics `Session`
was created instead of inferring it, the Epic adds permanent, cheap tracking columns to `Session`
and `Visit` (#1712 storage, #1713 API, #1714 UI). This issue updates the investigation specs
(`docs/agents/specs/statistics-bug.md` and `docs/agents/specs/statistics-bug/`) so they describe
the columns and how the investigation uses them, before they are implemented. Docs only.

## Problem

The specs predate the tracking columns: the investigation plan forbids middleware changes and
schema migrations, the sub-issue table does not list #1708 or #1711–#1714, and the hypotheses
and scripts rely on timestamp/IP heuristics only.

## Solution

- **New aspect page `specs/statistics-bug/tracking-columns.md`** — the single design contract
  for #1712–#1714; every other spec page links to it instead of repeating the definitions. It
  follows the specs convention (like `export-endpoint.md` for #1699): the permanent description
  is written by the implementing PRs into [Access Statistics](../statistics.md), and this page
  is deleted with the specs folder, with nothing to migrate. Outline:
  - **Intro:** part of the Statistics Bug specs; why the columns exist; they are permanent and
    stay after the fix.
  - **Columns** — table *model | column | type | meaning | written when*:
    - `Session.first_path` — route pattern of the creating request (see *Path values*);
    - `Session.first_seen_logged` — whether the creating request ended authenticated (user at
      creation, in-place attach after the view, or a login rotation);
    - `Session.creation_reason` — why the row was created (next section);
    - `Visit.first_path` / `Visit.last_path` — on `Visit` because it is already updated on
      every request, while the session's `last_seen_at` is throttled.
  - **Creation reasons** — table *reason | trigger in the code* (`_load_or_create_session` /
    `attach_user`): `no_cookie`, `invalid_cookie`, `cookie_session_not_found`,
    `domain_changed`, `ip_changed`, `login_rotation`; with the note that today's cookie lookup
    filters by domain, so #1712 must tell `domain_changed` apart from not found.
  - **Path values:** the path columns store the **route pattern**, never the raw path:
    `resolve(request.path_info).route` (e.g. `games/<slug:game_slug>/documents/<int:id>.json`),
    so no URL parameter is ever stored. This is what makes "no token or secret is ever stored"
    hold by construction: the device-authorization routes carry the request `uuid` (the poll
    secret) in the path (`users/authorization_requests/<uuid:uuid>.json`, `…/authorize.json`,
    `…/deny.json`), and ids/slugs are not stored either. A path that resolves to no route
    (404, bots) stores the fixed marker `unresolved`. Never the query string. Resolution is
    in-memory URL matching before the view runs (no database query). Max 255 characters.
  - **Rules:** untracked paths never stored; pre-migration rows `NULL` = unknown; no change to
    which sessions are reused or created; cost: no extra query per request, at most one extra
    lookup (to tell `domain_changed` from not found).
  - **Delivery:** #1712 storage → permanent `statistics.md` *Data model*; #1713 API →
    *Export endpoint* and *Visit list*; #1714 UI → *Visit list* / dashboard and i18n; #1701
    releases them, and production data collection starts after that release.
  - **How the investigation uses them:** short, linking to `hypotheses.md` and `scripts.md`.
  - Permanent docs never link into the specs; links only go from the specs outward.
- **`statistics-bug.md` (index):**
  - list the new page under *Aspect pages*;
  - **drop the `Status` column** of the *Sub-issues* table: it went stale (the PRs of #1698,
    #1699 and #1700 never updated it, since `auto-resolve-issue` does not know the rule).
    Status lives on GitHub — state above the table: "Status lives on GitHub: see Epic #1696's
    sub-issues. This table maps each sub-issue to the spec pages it follows." Columns become
    *Issue | Title | Page(s)*;
  - add rows: #1708 (scoped tokens through device authorization, backend → Export endpoint),
    #1711 (specs for the tracking columns → Tracking columns + affected pages), #1712 (storage,
    backend → Tracking columns), #1713 (API, backend → Tracking columns, Export endpoint),
    #1714 (UI, frontend → Tracking columns);
  - adjust rows: #1699 no longer covers scoped device authorization (moved to #1708); #1701
    also releases the tracking columns;
  - rule becomes "When a sub-issue is added or dropped, update this table" (merges need no
    edit).
- **`investigation-plan.md`:** new order (#1711 → #1712 → #1713 → #1714, #1701 after #1712 and
  #1713, production analysis after data has accumulated); relax the *Constraints* to allow the
  tracking-column changes while still forbidding any change to session reuse/creation.
- **`symptom.md`:** map each path of *How sessions are reused today* to its `creation_reason`.
- **`hypotheses.md`:** add a *Tracking evidence* line per hypothesis:
  - 1 (IP flip from Tent custom handlers): `ip_changed` with `first_path` on a custom-handler
    route;
  - 2a (no-cookie race): several `no_cookie` sessions within milliseconds, each with a
    different API `first_path`;
  - 2b (login-rotation race): several `login_rotation` sessions for one user at the same
    instant;
  - 2c (`Set-Cookie` ordering): no own reason (the older session is reused) — visits whose
    `last_path` alternates between two sessions, or `cookie_session_not_found` if the older
    one was deleted;
  - 3 (other IP change): `ip_changed` with an ordinary `first_path`, no burst;
  - 4 (domain mismatch): `domain_changed`;
  - 5 (cached `Set-Cookie`): `ip_changed` or a shared session whose `first_path` is a cached
    route;
  - 6 (cookie not stored/sent): a stream of `no_cookie` sessions whose `first_path` is not an
    entry page.
- **`export-endpoint.md`:** the new session and visit fields of the export payload.
- **`scripts.md`:** `emulate.py` expected creation reasons per scenario; `analyse.py` uses
  `creation_reason` as primary signal, heuristics as fallback for `NULL` rows, and reports per
  reason / `first_seen_logged` / top `first_path`.
- **`privacy.md`:** **no token or secret is ever stored** in a path column — guaranteed by
  storing route patterns (no URL parameters, no query string; the device-authorization `uuid`
  is the case that motivates it); the columns stay staff-only; reports and committed findings
  show paths only aggregated (counts), and any raw path that appears elsewhere (e.g. script
  logs) has ids and slugs masked (e.g. `/games/<slug>/…`).

## Out of scope

Implementation (#1712–#1714); script code (#1702, #1703).

## Responsible agent

architect
