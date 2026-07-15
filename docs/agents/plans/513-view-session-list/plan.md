# Plan: View session list

Issue: [513-view-session-list.md](../../issues/513-view-session-list.md)

## Overview

Add a `next_session` summary to the game detail endpoint and surface it (plus a link to the
sessions page) on the game page. Replace the single flat, paginated sessions list endpoint
with three paginated endpoints split by past/future/unscheduled, and rework the sessions page
into 3 columns. Add a `description` text field to `GameSession`, exposed on detail/create/update
only (not list). The session detail/new/edit pages and their DM/admin permission gating already
exist from a prior issue and are not changed by this plan.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### `GET /games/:game_slug.json` — new `next_session` field

Added to `GameDetailSerializer`. Shape:

```json
{
  "next_session": {
    "title": "<string>",
    "date": "<ISO date string, nullable>"
  }
}
```

- `null` when the game has no sessions at all.
- Otherwise: the session with the earliest `date >= today`; if no session has `date >= today`
  but at least one session has a date, treat as no upcoming session (see backend Notes for the
  exact fallback rule); if **no session has any `date`**, fall back to the first session by id.

### Session list split — 3 new read endpoints, 1 removed

Replaces `GET /games/:game_slug/sessions.json` (removed) with three paginated endpoints, all
`AllowAny`, all returning `GameSessionListSerializer` items (`id`, `title`, `date`, `game_slug`)
with the existing pagination response headers (`page`, `pages`, `per_page`, `total`):

| Endpoint | Filter | Order |
|---|---|---|
| `GET /games/:game_slug/sessions/past.json` | `date < today` | most recent first (`-date`) |
| `GET /games/:game_slug/sessions/future.json` | `date >= today` | soonest first (`date`) |
| `GET /games/:game_slug/sessions/unscheduled.json` | `date is null` | by id |

`POST /games/:game_slug/sessions.json` (create) is unchanged — same URL, same
`GameSessionCreateSerializer`/`GameSessionEditPermission` behavior.

### `description` field on `GameSession`

New nullable `TextField`. Exposed on `GameSessionDetailSerializer`,
`GameSessionCreateSerializer`, and `GameSessionUpdateSerializer` only — **not** added to
`GameSessionListSerializer`, so the 3 list endpoints above keep returning the same 4 fields as
today. Same read/write access as `title`/`date` (public read, `GameSessionEditPermission` for
write) — see product-owner review in the issue discussion.

## Notes

- The frontend sessions page needs 3 independently-paginated columns on one route. There is no
  existing precedent for this in the codebase (`Pagination`/`PaginationHelper` hardcode
  `page`/`per_page` as the query param names) — see [frontend.md](frontend.md) Notes for the
  chosen approach.
