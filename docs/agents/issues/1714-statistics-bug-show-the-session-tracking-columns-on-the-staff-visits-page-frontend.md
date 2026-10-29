# Issue: Statistics bug: show the session tracking columns on the staff visits page (frontend)

## Description

Part of Epic #1696 (statistics session investigation). `GET staff/statistics/visit-list.json`
now returns, per visit row (#1713), the visit's `first_path` / `last_path` and the session's
`session_first_path`, raw `session_creation_reason` and `session_first_seen_logged`. Show them
on the staff statistics **Visit list** tab so staff can see where and why a visitor's session
was created.

## Solution

- **Mapping** (`VisitListController` `toRow`): camelCase the five fields (`firstPath`,
  `lastPath`, `sessionFirstPath`, `sessionCreationReason`, `sessionFirstSeenLogged`), keeping
  `null` as `null` (no `Boolean()` coercion of the logged flag).
- **Table** (`StatisticsVisitListTableHelper`): two new non-sortable columns after Hits:
  - **Paths** — the visit's first path, then its last path (on a second line);
  - **Session** — the session's first path, the translated creation reason, and whether it
    was logged at creation (yes / no).
- **Paths** are route patterns (e.g. `games/<slug:game_slug>/documents/<int:id>.json`, or the
  marker `unresolved`), shown as-is in monospace; long ones are truncated with an ellipsis and
  the full value in the `title` (hover).
- **`null`** (rows from before the tracking columns) renders as a translated "unknown" for
  each field — including the logged flag (`null` ≠ `false`).
- **Creation reason** as a translated label per value: `no_cookie`, `invalid_cookie`,
  `cookie_session_not_found`, `domain_changed`, `ip_changed`, `login_rotation`; an unexpected
  value falls back to the raw string.
- Small screens: the table stays `responsive` (horizontal scroll); no layout change beyond the
  two columns.
- **Translations** in `en` and `pt` (`staff_statistics_page.visit_list.*`).
- **Docs:** the visit list section of the statistics frontend docs under `docs/agents/`.

## Depends on

#1713 (tracking columns in the staff statistics API — merged).

## Out of scope

New filters or sorts on these fields; the export endpoint; any backend change.

## Testing

Jasmine specs: controller mapping of the five fields (including `null` and `false`); table
rendering of both columns, each reason label, the raw fallback, the truncation `title`, and the
`null` → "unknown" case; translation key sync check passes.

## Responsible agents

frontend; translator
