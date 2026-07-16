# Frontend Plan: Polls should show user avatar and show all votes

Main plan: [plan.md](plan.md)

## Shared contracts

`GET /games/:game_slug/polls/:id/votes.json` (via `PollClient#fetchPollVotes`, unchanged
signature) now resolves to:

```json
{
  "votes_count": [{"option": <option id>, "count": <int>}],
  "users": [{"id": <user id>, "name": "<username>", "avatar_url": "<url or null>"}],
  "votes": [{"id": <vote id>, "option": <option id>, "user_id": <user id>}]
}
```

`votes_count` always lists every poll option (zero-vote ones included with `count: 0`),
regardless of any `?user_id=` filter passed. `castPollVotes` (`PUT`) keeps returning a flat
array of `{id, option, user_id}` (only the `user`→`user_id` key rename, no envelope).

Depend on `translator`'s new `game_poll_page.votes_count_label` key for the count label text.

## Implementation Steps

### Step 1 — Update `PollClient`

`frontend/assets/js/client/PollClient.js`:
- `fetchPollVotes` (lines 59-78): update the JSDoc `@returns` description to reflect the new
  envelope shape (no behavioral change — same URL/params).
- `castPollVotes` (lines 80-98): update the JSDoc to note the response array's vote objects
  now use `user_id` instead of `user`.

### Step 2 — Fix the existing `?user_id=` pre-fetch to unwrap the envelope

`GamePollController#fetchCurrentVotes`
(`frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js:172-187`)
currently does `.then((votes) => safeSet(this.setSelectedOptionIds, votes.map((vote) =>
vote.option)))`, treating the fetch response as a flat array. Change it to read
`payload.votes` instead: `.then((payload) => safeSet(this.setSelectedOptionIds,
payload.votes.map((vote) => vote.option)))`.

### Step 3 — Fetch the full votes payload for every allowed viewer

Add a new controller method (parallel to `#fetchCurrentVotes`, but unconditional — not gated
by `canVote`) that fetches `votes.json` with no `user_id` filter and stores the full
`{votes_count, users, votes}` payload via a new setter, e.g. `setVotesPayload`. Call it from
`#handleAccess` (`GamePollController.js:126-141`) right after `#fetchPoll`, for every viewer
allowed onto the page (mirrors how `#fetchPoll` itself is unconditional, unlike
`#fetchCurrentVotes` which is gated by `canVote`).

Add the corresponding `votesPayload`/`setVotesPayload` state to `GamePoll.jsx` (mirrors the
existing `poll`/`setPoll` state) and thread it through to the controller constructor and into
`GamePollHelper.render(...)`.

### Step 4 — Render vote counts and voter avatars per option

`GamePollHelper.jsx` needs both `#renderOptions` (closed/inactive polls, lines 111-126) and
`#renderVoteOption` (open/votable polls, lines 154-173) to show, per option: its count from
`votesPayload.votes_count` and one `Avatar` (`frontend/assets/js/components/common/
Avatar.jsx`) per voter, resolved by joining `votesPayload.votes` (filtered to that option) →
`votesPayload.users` by `user_id`.

Build a small lookup once per render (e.g. a `Map` from `user_id` to user, and a `Map` from
option id to `{count, voterUserIds}}`) rather than re-scanning the arrays per option — pass
`votesPayload` down and derive these maps in `render()` before delegating to
`#renderOptions`/`#renderVoteForm`.

Render each voter's avatar as `<Avatar url={user.avatar_url} alt={user.name} />`, and the
count as `{Translator.t('game_poll_page.votes_count_label')}: {count}` (or similar — match
existing badge/label styling used elsewhere on this page, e.g. the type/status badges at
lines 61-68).

### Step 5 — Tests

- `frontend/specs/assets/js/components/resources/game/pages/controllers/
  GamePollController/buildEffectSpec.js`: cover the new unconditional votes-payload fetch
  (called for both voters and non-voting viewers) and that `fetchCurrentVotes` now reads
  `payload.votes`.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GamePollHelperSpec.js`:
  cover rendering counts (including a zero-vote option) and avatars per option, for both the
  votable and read-only branches.
- `frontend/specs/assets/js/components/resources/game/pages/GamePollSpec.js`: cover the new
  `votesPayload` state wiring if the existing spec asserts on `GamePollHelper.render` call
  args.

## Files to Change

- `frontend/assets/js/client/PollClient.js` — JSDoc updates for the new payload shape
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js` — fix
  `#fetchCurrentVotes`, add the unconditional votes-payload fetch
- `frontend/assets/js/components/resources/game/pages/GamePoll.jsx` — new `votesPayload` state
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx` — render
  counts + avatars per option
- `frontend/specs/.../GamePollController/buildEffectSpec.js` — updated/new coverage
- `frontend/specs/.../helpers/GamePollHelperSpec.js` — updated/new coverage
- `frontend/specs/.../GamePollSpec.js` — updated coverage if needed

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `checks`)

## Notes

- Keep the avatar list per option reasonably sized in the DOM (no pagination requested by the
  issue) — if a poll option realistically accumulates a very large number of voters, that's an
  unaddressed edge case, flag it during review rather than pre-building pagination for it.
