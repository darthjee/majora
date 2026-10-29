# New `tracking-columns.md` page

Create `docs/agents/specs/statistics-bug/tracking-columns.md`, the single design contract for
#1712–#1714. Structure:

- **Title and intro:** `# Session Tracking Columns`; "Part of the [Statistics Bug](../statistics-bug.md)
  specs (Epic #1696)."; *Planned by #1712 (storage), #1713 (API), #1714 (UI).* Why: read *why*
  each session was created instead of inferring it from timestamps and IPs. The columns are
  permanent and stay after the fix.
- **`## Columns`** — table *Model | Column | Type | Meaning | Written when*:
  - `Session.first_path` — `CharField(255)`, null — route pattern of the creating request —
    at creation;
  - `Session.first_seen_logged` — boolean, null — whether the creating request ended
    authenticated (user at creation, in-place attach after the view, or a login rotation) —
    once, in the creating request;
  - `Session.creation_reason` — `CharField` with choices, null — see *Creation reasons* — at
    creation;
  - `Visit.first_path` — `CharField(255)`, null — route pattern of the request that opened
    the visit — when the visit opens;
  - `Visit.last_path` — `CharField(255)`, null — route pattern of the latest request of the
    visit — when the visit opens and in the existing `hits = hits + 1` update.
  - One sentence on why the last path lives on `Visit`: it is already updated on every
    request, while `Session.last_seen_at` is throttled (`session_touch_interval`).
- **`## Creation reasons`** — table *Reason | Trigger*:
  - `no_cookie` — no `majora_statistics` cookie;
  - `invalid_cookie` — the cookie fails to unsign;
  - `cookie_session_not_found` — valid token, no matching row (deleted, cleared — #1684);
  - `domain_changed` — the token's session exists, for another domain;
  - `ip_changed` — the cookie's session exists, the IP differs;
  - `login_rotation` — `attach_user` created a new row (always-rotate, or the in-place attach
    lost a race).
  - Note: today `_session_from_cookie` filters by token **and** domain, so a domain change
    looks like "not found"; #1712 must tell them apart (e.g. look up by token, then compare
    the domain) without changing which sessions are reused or created.
- **`## Path values`:** route pattern from `resolve(request.path_info).route` (example
  `games/<slug:game_slug>/documents/<int:id>.json`); a path resolving to no route stores
  `unresolved`; never the raw path or query string; max 255 characters; resolution is
  in-memory URL matching before the view runs. Why: **no token or secret is ever stored** —
  the device-authorization routes (`users/authorization_requests/<uuid:uuid>.json`,
  `account/authorization_requests/<uuid:uuid>/authorize.json`, `…/deny.json`) carry the request
  `uuid` in the path, and the poll requests stay tracked (see
  [Export endpoint](export-endpoint.md#caching-and-tracking)); ids and slugs are not stored
  either.
- **`## Rules`:** untracked paths and skip-header requests store nothing; rows from before the
  migration keep `NULL` (= unknown), no backfill; no change to which sessions are reused,
  created or rotated (the fix belongs to #1705's issue); cost: no extra query per request, at
  most one extra lookup (to tell `domain_changed` from not found).
- **`## Delivery`:** #1712 storage → documents the columns in the permanent
  [Access Statistics](../../statistics.md) *Data model*; #1713 API → *Export endpoint* and
  *Visit list*; #1714 UI → *Visit list* / dashboard, `en` and `pt` translations; #1701 releases
  them, and production data carries them only from that release on.
- **`## How the investigation uses them`:** short — `emulate.py` checks the expected reason per
  scenario, `analyse.py` uses `creation_reason` as the primary signal; links to
  [Hypotheses](hypotheses.md) and [Scripts](scripts.md).

## Files to Change

- `docs/agents/specs/statistics-bug/tracking-columns.md` — new page.
