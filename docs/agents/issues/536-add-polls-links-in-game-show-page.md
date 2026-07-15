# Add Polls Links In Game Show Page

## Context

Games currently have `Poll`, `PollOption`, and `PollVote` models (from a recent migration), but the feature is incomplete: `Poll` has no `title` or `description` field, there are no backend endpoints (views/serializers/urls) for polls at all, and there is no frontend surface for polls — no widget on the game page, no list/show/new pages, no routes. This issue delivers the full poll feature end to end (model fields, backend endpoints, and frontend pages), except for voting, which is out of scope and will be delivered separately.

## What needs to be done

**Backend:**
- Migration adding `title` (string) and `description` (text) fields to `Poll`.
- `GET /games/:game_slug/polls.json` — list, accepts a `status` filter, paginated, `X-Skip-Cache` (no caching).
- `GET /games/:game_slug/polls/:id.json` — show, `X-Skip-Cache` (no caching).
- `POST /games/:game_slug/polls.json` — create (poll + options together).
- All three endpoints restricted to the game's DM(s), players, and admins (superuser/staff) — follow the same permission-check pattern already used for session messages (`SessionMessagePermission` in `backend/games/permissions.py`), adapted for polls.

**Frontend:**
- Game show page widget: right below the "Next session" section on `/#/games/:game_slug`, show a widget with the count of open polls and a link to the game polls list.
  - Visible only to the game's DM(s), players, and admins (superuser/staff) — same audience as the rest of the game page's player/DM-only sections.
  - The count comes from `GET /games/:game_slug/polls.json?per_page=1&status=open`, reading the total count from the pagination headers (not the body).
  - While the request is in flight, show a bootstrap loading placeholder/animation instead of the number.
- Game polls list — `/#/games/:game_slug/polls`: lists all polls for the game, supports a `status` filter, paginated, only visible to the game's DM(s), players, and admins.
- Game poll show — `/#/games/:game_slug/polls/:id`: shows a single poll's details, only visible to the game's DM(s), players, and admins.
- New game poll — `/#/games/:game_slug/polls/:id/New`:
  - Form fields: title, description, type (radio: single choice / multiple choice).
  - Below the type field, a list of options, each a free-text input.
  - Each filled option gets a trash-fill (bootstrap icon) button to remove it; the last, still-blank option has no trash icon.
  - Typing into the last (blank) option automatically appends a new blank option after it, so there's always exactly one blank option at the end.
  - A "create" button at the bottom submits the poll and its options together in one request; blank options are not submitted.
  - Only accessible to the game's DM(s), players, and admins.
- Register the new routes in the frontend access-route config alongside the existing `/games/:game_slug/...` routes.

**Out of scope:**
- Voting on polls (`PollVote`) — tracked separately.

## Acceptance criteria

- [ ] `Poll` model has `title` and `description` fields, added via migration.
- [ ] `GET /games/:game_slug/polls.json` lists polls, supports `status` filter, is paginated, restricted to DM(s)/players/admins, and skips caching.
- [ ] `GET /games/:game_slug/polls/:id.json` shows poll details, restricted to DM(s)/players/admins, and skips caching.
- [ ] `POST /games/:game_slug/polls.json` creates a poll with its options in one request, restricted to DM(s)/players/admins.
- [ ] Game show page displays an open-polls-count widget below "Next session", visible only to DM(s)/players/admins, showing a loading placeholder while fetching and linking to the game polls list.
- [ ] Game polls list page (`/#/games/:game_slug/polls`) lists polls with a status filter and pagination, restricted to DM(s)/players/admins.
- [ ] Game poll show page (`/#/games/:game_slug/polls/:id`) displays poll details, restricted to DM(s)/players/admins.
- [ ] New game poll page (`/#/games/:game_slug/polls/:id/New`) supports creating a poll with title, description, type, and a dynamically-growing list of options (with trash-icon removal and auto-appending blank option), restricted to DM(s)/players/admins.
- [ ] New routes are registered in the frontend access-route config.
