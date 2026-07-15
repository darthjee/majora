# Plan: Add Polls Links In Game Show Page

Issue: [536-add-polls-links-in-game-show-page.md](../issues/536-add-polls-links-in-game-show-page.md)

## Overview

`Poll`, `PollOption`, and `PollVote` models already exist (migration `0042_poll_polloption_pollvote`), but `Poll` has no `title`/`description`, and there is no backend or frontend surface for polls at all. This plan adds those missing fields, three new game-scoped poll endpoints (list/filter/paginate, show, create-with-options), a small "open polls" widget on the game show page, and three new frontend pages (list, show, new). Voting (`PollVote`) stays out of scope. Access for all of it — viewing and creating — is uniformly the game's DM(s), players, and admins (superuser/staff), the same audience already used for `GameSessionMessage` (confirmed against `docs/agents/product.md` and the existing `SessionMessagePermission` precedent).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoints (backend produces, frontend consumes)

| Method | URL | Notes |
|---|---|---|
| GET | `/games/<slug>/polls.json` | List, `?status=` filter, paginated (`Paginator`/`paginated_list_response` convention: `page`/`per_page` request params, `page`/`pages`/`per_page`/`total` response headers, plain JSON array body). `X-Skip-Cache: true`. |
| GET | `/games/<slug>/polls/<id>.json` | Detail, including nested `options`. `X-Skip-Cache: true`. |
| POST | `/games/<slug>/polls.json` | Create a poll and its options in one request. `X-Skip-Cache: true`. |

All three require the requester to be authenticated and to be one of: the game's DM(s), a player of the game, or `is_superuser`/`is_staff` — enforced by a new `PollPermission` in `backend/games/permissions.py`, applied uniformly to GET and POST (unlike `SessionMessagePermission`, whose create check is deliberately stricter than its view check; polls intentionally use the *same* check for both, per the issue's explicit wording — confirmed as an intentional, not accidental, divergence).

### Response shapes

List item / detail (detail additionally nests `options`):

```json
{ "id": 1, "title": "Which tavern?", "type": "single", "status": "open" }
```

```json
{
  "id": 1, "title": "Which tavern?", "description": "Pick one for tonight.",
  "type": "single", "status": "open",
  "options": [{ "id": 10, "option": "The Drunken Griffin" }, { "id": 11, "option": "The Rusty Anchor" }]
}
```

Create request payload:

```json
{
  "title": "Which tavern?", "description": "Pick one for tonight.", "type": "single",
  "options": [{ "option": "The Drunken Griffin" }, { "option": "The Rusty Anchor" }]
}
```

`type` is one of `Poll.TYPE_SINGLE` (`"single"`)/`Poll.TYPE_MULTIPLE` (`"multiple"`); `status` is one of `Poll.STATUS_OPEN`/`STATUS_INACTIVE`/`STATUS_CLOSED` (`"open"`/`"inactive"`/`"closed"`). **Decision** (not specified by the issue, since no status-change endpoint exists yet): newly created polls are set to `STATUS_OPEN` explicitly in `PollCreateSerializer.create()` — the model's own default (`STATUS_INACTIVE`) is left untouched for any other code path, but a poll nobody can ever reopen would make the open-polls-count widget permanently show zero for every new poll, which defeats the point of this issue. Flagged here for visibility; open to correction in review.

### Frontend routes (new)

- `#/games/:game_slug/polls` -> page key `gamePolls` (list, `status` filter + pagination)
- `#/games/:game_slug/polls/new` -> page key `gamePollNew` (create form)
- `#/games/:game_slug/polls/:id` -> page key `gamePoll` (detail)

**Deviation from the issue's literal text**: the issue writes the new-poll route as `/#/games/:game_slug/polls/:id/New` — that doesn't match this codebase's routing convention (every other `*New` page is `/games/:game_slug/<resource>/new`, lowercase, no `:id` segment — see `gameSessionNew`, `gameNpcNew`, `gameTreasureNew` in `HashRouteResolver.js`), and a poll doesn't exist yet at creation time so an `:id` segment there wouldn't make sense either. Treated as a typo in the issue; `frontend` registers `/games/:game_slug/polls/new` instead, consistent with the existing pattern. Register it **before** the `:id` detail route so it isn't swallowed by it (same ordering already used for the other `*New`/`:id` pairs).

### Widget visibility (frontend, no new backend work)

The DM(s)/players/admins audience check reuses data the game show page already loads: `GameController` already merges `AccessStore.getGameAccess(gameSlug)` (backed by the existing `GET /games/<slug>/access.json`, `GameAccessSerializer`) onto the `game` object, exposing `is_dm`/`is_player`/`is_superuser`/`is_staff`. The widget (and the three new pages' controllers) gate on `is_dm || is_player || is_superuser || is_staff` — no new access endpoint needed.

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

New namespaces `game_polls_page`, `game_poll_page`, `game_poll_new_page`, plus a couple of keys added to the existing `game_page` namespace for the widget (see `translator.md` for the concrete key list). `frontend` must call `Translator.t()` for every new string it introduces, not hardcode English text.

## Notes

- `data-access` and `security` review should be invoked once `backend` finishes, since three new authenticated endpoints are added.
- `docs/agents/access-control.md` (new `docs/agents/access-control/poll.md`) and `docs/agents/product.md` should get a short **Poll** entry once this lands, per the product-owner agent's recommendation — the architect will add these in the same PR, in parallel with/after the backend implementation, not as part of either specialist's own plan file.
