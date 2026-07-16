# Frontend Plan: Add Poll Voting

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend endpoints and model change from [plan.md](plan.md)'s "Shared contracts":
`GET`/`PUT /games/<game_slug>/polls/<poll_id>/votes.json` (option-id list in/out, `{id, option,
user}` per vote), and relies on `GET /users/status.json`'s existing `user_id` field to know the
current user's id for the `user_id` filter. Also relies on `AccessStore.ensureGameAccess`'s
`is_dm`/`is_player`/`is_staff` flags (already fetched today, see Step 1) to decide whether vote
controls are enabled.

## Implementation Steps

### Step 1 — Thread viewer role into the poll page
`GamePollController.js` already resolves `access` (`is_dm`/`is_player`/`is_superuser`/
`is_staff`) via `AccessStore.ensureGameAccess(gameSlug)` in `buildEffect()`/`#handleAccess`
(`frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js:57-79`)
purely to gate page visibility today. Reuse that same resolved `access` object — store it in new
`GamePoll.jsx` state (`canVote = access.is_dm || access.is_player`) and pass it down to
`GamePollHelper.render`, instead of fetching access again.

### Step 2 — `BaseClient.putJson`
`BaseClient` already has `postJson`/`patchJson`, both thin wrappers around a private
`#writeJson(method, ...)` (`frontend/assets/js/client/BaseClient.js:157-181`). Add `putJson(path,
token, fields, extraHeaders)` calling `#writeJson('PUT', ...)`, mirroring the existing two.

### Step 3 — `PollClient` vote methods
In `frontend/assets/js/client/PollClient.js`, alongside `fetchPoll`/`createPoll`:
- `fetchPollVotes(gameSlug, pollId, token, params = new URLSearchParams())` — `GET
  .../polls/<id>/votes.json`, `X-Skip-Cache: true`, appending `params` as query string the same
  way `fetchPolls` does.
- `castPollVotes(gameSlug, pollId, token, optionIds)` — `this.putJson(
  \`/games/${gameSlug}/polls/${pollId}/votes.json\`, token, { option_ids: optionIds })`.

### Step 4 — Pre-populate the current vote(s)
In `GamePollController` (or a new small controller method it delegates to), once `canVote` is
true, call `AuthClient.status(AuthStorage.getToken())` to read `user_id` (same call shape as
`HeaderController.js`'s use of `this.client.status(...)`), then
`pollClient.fetchPollVotes(gameSlug, id, token, new URLSearchParams({ user_id: String(userId) }))`
to get the user's existing vote(s), and derive the initially-selected option id(s) from the
response array's `option` fields.

### Step 5 — Vote controls on the poll page
Extend `PollOptionValue.jsx` / `GamePollHelper.jsx`
(`frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx`) so each option
row renders a checkbox (`poll.type === 'multiple'`) or radio (`poll.type === 'single'`) to its
left when `poll.status === 'open'`, backed by React state for the selected option id(s) — radios
share a `name` per poll so only one can be active, matching the existing single/multiple type
selector pattern in `GamePollNewHelper.jsx:98-110` and the checkbox pattern in
`GameTasksHelper.jsx:84-95`. Below the options, add a submit button labeled via
`game_poll_page.cast_votes` (multiple) or `game_poll_page.cast_vote` (single) that calls
`castPollVotes` with the selected option id(s) and refreshes the pre-populated state from the
response on success.

### Step 6 — Disable for admin-only viewers
When `canVote` is `false` (viewer is `is_staff`/`is_superuser` but not `is_dm`/`is_player`),
render the checkboxes/radios and the submit button `disabled`, matching the issue's explicit
"disabled, not hidden" requirement — same visibility (all three roles can view) as today, only
the interactive state changes.

### Step 7 — Tests
- `PollClientSpec` — add specs for `fetchPollVotes`/`castPollVotes`
  (`frontend/specs/assets/js/client/PollClient/`, mirroring `fetchPollSpec.js`/`createPollSpec.js`).
- `BaseClient` — add a spec for `putJson` if `postJson`/`patchJson` have their own spec files;
  otherwise extend whichever spec already covers `#writeJson`.
- `GamePollHelperSpec`/`GamePollSpec` — cover: checkbox vs radio rendering per poll type, cast
  button label per type, pre-population from the fetched votes, and the disabled state for an
  admin-only viewer.
- `GamePollControllerSpec` — cover the votes pre-fetch and the `user_id` resolution from
  `/users/status.json`.

## Files to Change
- `frontend/assets/js/client/BaseClient.js` — add `putJson`.
- `frontend/assets/js/client/PollClient.js` — add `fetchPollVotes`/`castPollVotes`.
- `frontend/assets/js/components/resources/game/pages/GamePoll.jsx` — thread `canVote`/vote state.
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js` — fetch
  the user's current vote(s) once access is resolved.
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx` — render vote
  controls and the cast button.
- `frontend/assets/js/components/resources/game/pages/elements/PollOptionValue.jsx` (or a new
  sibling element for the interactive variant) — checkbox/radio rendering.
- Spec files listed in Step 7.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`) — Jasmine specs above.
- `frontend`: `npm run lint` (CI job: `frontend-checks`).

## Notes
- Confirm whether `PollOptionValue.jsx` should grow an interactive mode via a prop, or whether a
  separate `PollOptionVoteInput.jsx` element (parallel to `PollOptionInput.jsx`, the write-side
  counterpart used by `GamePollNewHelper.jsx`) is cleaner — favor whichever keeps the read-only
  detail view (still used when `poll.status !== 'open'`) simplest.
- The disabled-admin state has no existing UX precedent in this codebase (see backend agent's
  note); keep it a plain HTML `disabled` attribute on the inputs/button unless the codebase's
  Bootstrap usage elsewhere suggests a tooltip convention worth matching.
