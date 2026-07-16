# Issue: Add Poll Voting

## Description
On a poll's show page (`/#/games/:game_slug/polls/:id`), players and DMs should be able to cast a vote for one or more options directly from the page, instead of the current read-only view. Admins (superuser/staff, not otherwise a player or DM of the game) can still view the page but cannot vote.

## Problem
The `Poll`, `PollOption`, and `PollVote` models already exist (from prior issues), and the poll show page (`GamePoll.jsx`/`GamePollHelper.jsx`) already renders a poll's title, description, type, status, and a **read-only** list of options — voting was explicitly out of scope for that issue. `PollVote` has no endpoint at all yet (`GET`/`PUT`), so there is currently no way for a player or DM to cast, change, or view a vote through the app.

Additionally, `PollVote.player` currently links to `games.Player`, but a game's DM(s) are tracked via a separate `GameMaster` model with no `Player` link — a DM who isn't also enrolled as a `Player` of the game has no `Player` row to vote as. Since there are no votes in production yet, this is safe to fix by re-pointing `PollVote` at `auth.User` directly instead of `Player`.

## Expected Behavior

### Poll show page (`/#/games/:game_slug/polls/:id`)
- Players and DMs see each option with a selectable control to its left:
  - `multiple`-type polls: a checkbox per option, allowing more than one selection.
  - `single`-type polls: a radio button per option, allowing exactly one selection.
- Below the options, a submit button casts the vote(s):
  - `multiple`-type polls: labeled "Cast Votes" (plural).
  - `single`-type polls: labeled "Cast Vote" (singular).
- On entering the page, if the user is a DM or player, their existing vote(s) for that poll are fetched and used to pre-populate the selection, via `GET /#/games/:game_slug/polls/:id/votes` filtered by the current user's id (obtained from the already-loaded `/users/status.json` response).
- Admins (who are not also a player or DM of the game) can view the page, the options, and the current vote state, but the option controls and the "Cast Vote(s)" button are disabled for them.

### Backend endpoints
- `GET /games/:game_slug/polls/:id/votes.json` — returns votes for that poll, `X-Skip-Cache`. Accepts an optional `user_id` filter; without it (or with any other user's id) it returns votes for every voter, so any allowed viewer can see the full per-user breakdown, not just their own. Allowed for the game's DM(s), players, and admins (superuser/staff) — same view-level rule as the existing poll list/show/create endpoints (`PollPermission`).
- `PUT /games/:game_slug/polls/:id/votes.json` — body carries the list of option ids the requesting user is casting for that poll; replaces that user's votes for the poll accordingly:
  - `single`-type: at most one vote per user per poll; a dedicated class updates the existing `PollVote` row's option in place (or creates it if the user has no vote yet for this poll).
  - `multiple`-type: a dedicated class creates new `PollVote` rows for options in the payload the user hadn't voted for yet, and deletes that user's existing votes for options no longer present in the payload.
  - Only available to the game's DM(s) and players (no superuser/staff bypass) — a pure admin gets the same treatment as an unauthorized user.

## Solution

### Model
- Migration replacing `PollVote.player` (FK to `games.Player`) with `PollVote.user` (FK to `auth.User`, `related_name='poll_votes'`). No data migration needed — there are no votes in production yet.
- `unique_together` becomes `[('user', 'option')]`.
- `clean()`'s membership check changes from "player belongs to `poll.game.players`" to "user is a player or game master of `poll.game`" (`game.players.filter(user=user).exists() or game.game_masters.filter(user=user).exists()`), so DMs can vote without needing a `Player` row. The single-type second-vote check stays the same, keyed on `user` instead of `player`.

### Backend
- New serializers under `backend/games/serializers/games/polls/` for reading votes (`PollVoteSerializer`: `id`, `option`, `user`) and for writing them (accepting a list of option ids the user is casting).
- New views under `backend/games/views/polls/` for `GET`/`PUT` on `games/<slug>/polls/<id>/votes.json`, routed in `backend/games/urls/games.py` alongside the existing poll routes, both setting `X-Skip-Cache: true` and using `get_object_or_404`.
- New `PollVotePermission` in `backend/games/permissions.py`, following the `SessionMessagePermission` split (`check_view` allows the admin/staff bypass, `check_vote` does not — only an actual player or DM of the game).
- Dedicated vote-persisting classes (one for `single`, one for `multiple`) encapsulating the create/update-in-place/delete logic described above, keeping the view/serializer thin.
- Update `docs/agents/access-control/poll.md`'s "Vote (`PollVote`)" row, which currently reads "Not exposed by any endpoint", to document the new endpoints, their permission rules, and the `player` → `user` model change.

### Frontend
- Extend `PollOptionValue`/`GamePollHelper` (or a new sibling component) to render a checkbox/radio per option instead of a plain value when the poll is open and the user is a player or DM, plus the "Cast Vote(s)" submit button.
- Add `fetchPollVotes`/`castPollVotes` methods to `PollClient.js`, mirroring `fetchPoll`/`createPoll`'s `X-Skip-Cache` handling.
- On page load, resolve the current user's id from the already-loaded `/users/status.json` response and call the votes-fetch endpoint filtered to that id, to pre-populate the current selection.
- Disable the option controls and submit button when the viewer is an admin without a player/DM role in the game.
