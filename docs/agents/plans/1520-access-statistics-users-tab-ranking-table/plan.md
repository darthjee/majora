# Plan: Access statistics: Users tab (ranking table)

Issue: [1520-access-statistics-users-tab-ranking-table.md](../../issues/1520-access-statistics-users-tab-ranking-table.md)

## Overview

Replace the Users tab placeholder with a server-sorted, paginated ranking table of logged-in
users, backed by the existing `GET /staff/statistics/users.json` endpoint (#1519). The
behavior is defined in `docs/agents/specs/access-statistics/users.md` ("Filters" and
"Chart and layout"). The code follows the layering the Domains tab (#1517) uses: a thin page,
a `*Body` element, a state helper, a controller, a table with its own controller/helper, and a
pure sort helper. The translator adds the `users.*` keys; the frontend agent builds the tab.

## Agents involved

- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

### i18n keys

Namespace `staff_statistics_page`, new `users:` block (en + pt), consumed by the frontend
through `Translator.t('staff_statistics_page.users.<key>')`:

| Key | en |
|-----|----|
| `users.title` | Users |
| `users.user` | User |
| `users.visits` | Visits |
| `users.time_on_site` | Time on site |
| `users.average_duration` | Avg duration |
| `users.hits` | Hits |
| `users.domains` | Domains |
| `users.last_seen` | Last seen |
| `users.unknown_domain` | unknown |
| `users.profile` | Profile |
| `users.sorted_descending` | Sorted descending |
| `users.empty` | No logged-in users in this range. |
| `users.load_error` | Unable to load users. |

(`load_error` is added on top of the spec list, matching `domains.load_error`.)

### API (already shipped by #1519)

`GET /staff/statistics/users.json`. The query is the shared statistics filters
(`StatisticsQuery.fromHash()`) plus `sort` (`visits` default, `time_on_site`,
`average_duration`, `hits`, `last_seen`) and `page` / `per_page`. The response is a plain
array of `{ id, name, display_name, email, visits, time_on_site_seconds,
average_duration_seconds, hits, domains: [{ id, domain }], last_seen_at }`, with the
pagination headers (`page`, `pages`, `per_page`, `total`) surfaced by RequestStore as
`pagination`.
