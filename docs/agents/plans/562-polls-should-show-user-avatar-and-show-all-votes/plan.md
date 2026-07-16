# Plan: Polls should show user avatar and show all votes

Issue: [562-polls-should-show-user-avatar-and-show-all-votes.md](../issues/562-polls-should-show-user-avatar-and-show-all-votes.md)

## Overview

The `GET /games/:game_slug/polls/:id/votes.json` endpoint already exists but only returns
raw `{id, option, user}` rows via `PollVoteSerializer` — no vote counts, no voter identity.
This plan changes that `GET` response to an envelope of `{votes_count, users, votes}`, then
updates the game poll detail page to fetch it and render, per option, its vote count and one
small avatar per voter. A new translation key is needed for the vote-count label.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

**`GET /games/:game_slug/polls/:id/votes.json`** — new response envelope (array-based shape,
replaces the old flat array):

```json
{
  "votes_count": [
    {"option": 1, "count": 3},
    {"option": 2, "count": 0}
  ],
  "users": [
    {"id": 7, "name": "alice", "avatar_url": "https://.../avatar.png"}
  ],
  "votes": [
    {"id": 42, "option": 1, "user_id": 7}
  ]
}
```

- `votes_count` — **one entry per poll option, always** (including options with zero votes),
  keyed by `option` (the `PollOption` id). Never filtered by `?user_id=` — it always reflects
  the whole poll's tally, since per-user counts wouldn't be meaningful.
- `users` — only users who cast at least one vote captured in `votes` below (so it is scoped
  by `?user_id=` the same way `votes` is). `name` is the `User.username`; `avatar_url` follows
  the existing Gravatar-based pattern from `SessionMessageUserSerializer`.
- `votes` — same rows as today, `option` unchanged (`PollOption` id), but the `user` key is
  renamed to `user_id` to match the issue's payload spec. Still respects the existing
  `?user_id=` query filter.
- The `PUT .../votes.json` (vote cast) response is a **flat array** of these same
  `{id, option, user_id}` vote objects (unchanged shape otherwise, just the `user` → `user_id`
  rename) — it is not wrapped in the envelope, since the issue only asks for the `GET` (view)
  side to show counts/avatars.

`frontend` depends on this exact envelope shape for both:
1. `GamePollController#fetchCurrentVotes` (the existing `?user_id=`-filtered pre-fetch used to
   pre-populate the current user's selection) — now reads `payload.votes` instead of treating
   the response itself as the array.
2. A new unfiltered fetch that feeds `votes_count`/`users`/`votes` into `GamePollHelper` for
   rendering avatars and counts.

`translator` must add the `game_poll_page.votes_count_label` key that `frontend` renders next
to each option's count.

## Notes

- No new access-control restriction is introduced: `PollVotePermission.check_view` already
  lets any player/GM/superuser/staff see the full vote list for the poll (no anonymity concept
  on `Poll`), so exposing voter identity in this payload does not widen who can see what.
