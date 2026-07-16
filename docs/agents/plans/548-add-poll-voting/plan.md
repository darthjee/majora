# Plan: Add Poll Voting

Issue: [548-add-poll-voting.md](../../issues/548-add-poll-voting.md)

## Overview

Add voting to the existing poll show page (`/#/games/:game_slug/polls/:id`): players and DMs
select checkboxes (multiple-type) or radios (single-type) and cast their vote(s) via a new
`PUT .../votes.json` endpoint; the page pre-populates their current selection from a new
`GET .../votes.json` endpoint. This requires re-pointing `PollVote` from `Player` to `auth.User`
(no data migration needed — there are no votes in production yet) so DMs, who have no `Player`
row, can vote too. Admins who aren't also a player/DM of the game can view but not vote.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `GET /games/<game_slug>/polls/<poll_id>/votes.json`
- Query param: optional `user_id` (an `auth.User` id, matching the `user_id` field already
  returned by `GET /users/status.json`) — filters the response to that user's vote(s). Omitted (or
  any other value), returns every vote for the poll, so the endpoint doubles as a full per-option
  breakdown for any allowed viewer, not just the requester's own vote.
- Response: `200` with a JSON array of `{"id": <vote_id>, "option": <option_id>, "user": <user_id>}`.
- Headers: `X-Skip-Cache: true` always set.
- Permission: game's DM(s), players, and admins (superuser/staff) — same view-level rule as
  `PollPermission` (used by the existing list/show/create poll endpoints).

### `PUT /games/<game_slug>/polls/<poll_id>/votes.json`
- Request body: `{"option_ids": [<option_id>, ...]}` — the full set of options the requesting user
  is casting for this poll (empty array clears their vote(s)).
- Response: `200` with the requesting user's resulting votes, same shape as the `GET` array above
  (only this user's rows).
- Permission: only an actual player or DM of the game — **no** superuser/staff bypass. A pure
  admin gets a `403`, same as an unauthorized user.
- Server-side behavior:
  - `single`-type poll: at most one vote row per user; switching options updates that row's
    `option` field in place (never a delete+create).
  - `multiple`-type poll: creates rows for options in the payload not yet voted for by that user,
    deletes that user's existing rows for options no longer present in the payload.
- All option ids in the payload must belong to `poll_id`'s own options — otherwise `400`.

### Model change
- `PollVote.player` (FK to `games.Player`) is replaced by `PollVote.user` (FK to `auth.User`,
  `related_name='poll_votes'`). `unique_together` becomes `[('user', 'option')]`. `clean()`'s
  membership check becomes "user is a player or game master of `poll.game`".

### Poll detail viewer-role gating (frontend needs, backend enables)
- The frontend determines whether to enable the vote controls using the existing
  `AccessStore.ensureGameAccess(gameSlug)` (`is_dm`/`is_player`/`is_staff`) — the `gamePoll` route
  is already registered in `accessRouteConfig.js`, so no new backend endpoint is needed for this
  part. Controls are enabled when `is_dm || is_player`; disabled (not hidden) otherwise.
