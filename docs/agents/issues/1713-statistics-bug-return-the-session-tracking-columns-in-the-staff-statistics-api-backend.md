# Issue: Statistics bug: return the session tracking columns in the staff statistics API (backend)

## Description

Part of Epic #1696 (statistics session investigation). Return the session/visit tracking columns
stored by #1712 through the staff statistics API, so the investigation scripts and the staff
visit list (#1714) can use them.

## Solution

- **Export** `GET staff/statistics/export.json` (`StaffStatisticsExportSessionSerializer` /
  `StaffStatisticsExportVisitSerializer`): each session gains `first_path`,
  `first_seen_logged`, `creation_reason`; each visit gains `first_path`, `last_path`.
- **Visit list** `GET staff/statistics/visit-list.json` (`StaffStatisticsVisitSerializer`), flat
  like the existing `session_id` / `ip` / `domain` fields: each row gains the visit's
  `first_path` and `last_path`, and its session's `session_first_path`,
  `session_creation_reason` and `session_first_seen_logged`. No new filters or sort keys.
- **Values:** `creation_reason` is the raw stored value (`no_cookie`, `invalid_cookie`,
  `cookie_session_not_found`, `domain_changed`, `ip_changed`, `login_rotation`); the UI (#1714)
  translates it, the API returns no labels. Paths are the stored route patterns (or
  `unresolved`). `NULL` stays `null` (rows from before the migration).
- Still never the session token, user e-mail, name or profile data beyond what each endpoint
  already returns.
- **No query-count increase:** the visit list already joins the session
  (`select_related('session__…')`) and the export reads the columns from the session and
  visit rows it already loads.
- Same access rules as today: staff only (export also with a `statistics:read` token),
  `X-Skip-Cache`, `Cache-Control: private, no-store`, no caching.
- **Docs:** `docs/agents/statistics.md` — the new fields in the export payload and the
  visit-list payload; `docs/agents/specs/statistics-bug/export-endpoint.md` — drop the
  "*added by #1713*" marker (the fields are already described there). Permanent docs never link
  to the specs.

## Depends on

#1712 (storage of the tracking columns).

## Out of scope

UI (#1714); new filters/sorts; any change to the stored values.

## Testing

Backend tests for both endpoints: new fields present with values, each `creation_reason` value
returned raw, `null` for legacy rows, the session token still absent, query counts unchanged
(`django_assert_num_queries`).

## Responsible agents

backend; data-access (review)
