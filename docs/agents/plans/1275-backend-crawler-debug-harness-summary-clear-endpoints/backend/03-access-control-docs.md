# Access-control doc

Extend `docs/agents/access-control/staff-crawler.md` to cover the two new
methods alongside the existing `POST`/`GET` record create/list entries. No other
access-control file changes.

## Changes to `docs/agents/access-control/staff-crawler.md`

- Update the intro prose: replace "Both `POST` and `GET` enforce
  **Staff-or-superuser** inline (via `require_staff`)" / "Both responses set
  `X-Skip-Cache: true`" so it covers all four operations — the `POST`, `GET`,
  and `DELETE` on `/staff/crawler.json` plus the `GET` on
  `/staff/crawler/summary.json` — all Staff-or-superuser, all setting
  `X-Skip-Cache: true`.
- Add two rows to the "Action / Who can" table:

  | Action | Who can |
  |--------|---------|
  | Read per-`type` entry counts (`GET /staff/crawler/summary.json`) | **Staff-or-superuser** |
  | Clear the whole debug-emission table (`DELETE /staff/crawler.json`) | **Staff-or-superuser** |

- Extend the **Behavior** paragraph to note the summary returns per-`type`
  counts and the `DELETE` is a blanket clear (not scoped by `type`/`source`),
  both still part of the harness that is deleted wholesale once #1262 is trusted.

## Do not change

- `docs/agents/access-control/endpoints.md` — the staff-cache clear/summary pair
  is not listed there; the dedicated `staff-crawler.md` file is the documented
  home. Matching precedent, add nothing here.
- `docs/agents/access-control.md` index — the `staff-crawler.md` entry already
  exists.

## Files to Change

- `docs/agents/access-control/staff-crawler.md` — updated intro prose, two new
  table rows, extended Behavior paragraph. Keep lines within the markdownlint
  limit (`yarn lint_md`).
