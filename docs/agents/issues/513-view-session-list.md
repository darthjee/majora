# Issue: View session list

## Description
The game page (`/#/games/:game_slug`) should surface the upcoming session and link to a full session list. The session list page should organize sessions into past, future, and unscheduled columns instead of a single flat list. The `GameSession` model is also missing a `description` field.

Most of the session CRUD (detail page, new page, edit page, and their DM/admin permission gating) already exists from a previous issue. This issue covers the new pieces: the "next session" summary, the 3-column session list, and the `description` field.

## Problem
- The game page shows no indication of when the next session is happening; a player has to open the sessions list to find out.
- `GET /games/:game_slug/sessions.json` returns a single flat, paginated list of all sessions ordered by id, with no way to distinguish past, upcoming, and unscheduled sessions at a glance.
- `GameSession` has no `description` field, so sessions can't carry notes/summary text beyond a title and date.

## Expected Behavior

### Next session (on the game page)
- "Next session" is the session with the earliest `date` that is today or later.
- If no session has a `date`, fall back to the first session by id.
- If the game has no sessions at all, `next_session` is `null`.
- `GET /games/:game_slug.json` includes:
  ```json
  {
    "next_session": {
      "title": "<some title>",
      "date": "some date"
    }
  }
  ```
- The game page shows the next session info and a button to the game sessions page.

### Game sessions page — `/#/games/:game_slug/sessions`
- Sessions are shown in 3 columns, each showing title and date (paginated, same pattern as the current list):
  - Past, ordered most recent first — `GET /games/:game_slug/sessions/past.json`
  - Future (current date included), ordered soonest first — `GET /games/:game_slug/sessions/future.json`
  - Unscheduled (no date), ordered by id — `GET /games/:game_slug/sessions/unscheduled.json`
- Clicking a session goes to the game session detail page.
- "Back" and "New session" buttons are shown; "New session" is only visible to DM and admin.
- The old flat, paginated `GET /games/:game_slug/sessions.json` is removed now that it's superseded by the 3 endpoints above; `POST /games/:game_slug/sessions.json` (create) is unchanged.

### Game session detail page — `/#/games/:game_slug/sessions/:id` (already implemented)
- Shows session details.
- Has an "Edit" button, visible only to DM and admin.

### New game session page — `/#/games/:game_slug/sessions/new` (already implemented)
- Form to create a session; the date field uses a date picker but may be left empty.
- Only accessible to DM and admin.
- Backed by `POST /games/:game_slug/sessions.json`, restricted to DM and admin.

### Edit game session page — `/#/games/:game_slug/sessions/:id/edit` (already implemented)
- Form to edit a session; the date field uses a date picker but may be left empty.
- Only accessible to DM and admin.
- Backed by `PATCH /games/:game_slug/sessions/:id.json`, restricted to DM and admin.

## Solution

### Backend
- Add `description` (nullable text field) to `GameSession` (`backend/games/models/game/game_session.py`) with a migration, and wire it through the create/update/detail serializers under `backend/games/serializers/games/sessions/`.
- Add `next_session` to the game detail serializer (`backend/games/serializers/games/game_detail.py`), computed from the game's sessions using the "earliest date >= today, else first by id" rule.
- Add three new read endpoints under `backend/games/urls/games.py` / `backend/games/views/game_sessions/`: `sessions/past.json` (most recent first), `sessions/future.json` (soonest first), `sessions/unscheduled.json` (by id) — each paginated the same way as the current list, reusing the existing `GameSessionListSerializer` and `AllowAny` read access.
- Remove the old flat `GET /games/:game_slug/sessions.json` (list) now that it's superseded; keep `POST /games/:game_slug/sessions.json` (create) as-is.

### Frontend
- `Game.jsx` / `GameHelper.jsx`: render the next session info and a button to `#/games/:game_slug/sessions`.
- `GameSessions.jsx` / `GameSessionsHelper.jsx` / `GameSessionsController.js`: replace the single paginated list with 3 columns fetched from the new past/future/unscheduled endpoints, keeping the existing `PageActions` + `NewButton` (DM/admin only) pattern.
- Add a `description` textarea (reusing the existing `TextareaField` component) to the new/edit session forms and the session detail page.

## Benefits
- Players see at a glance when the next session is without leaving the game page.
- Past, upcoming, and unscheduled sessions are easy to tell apart instead of scanning one flat list.
- Sessions can carry a short description/summary, not just a title and date.
