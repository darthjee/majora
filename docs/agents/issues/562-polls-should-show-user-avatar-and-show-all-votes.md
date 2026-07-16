# Issue: Polls should show user avatar and show all votes

## Description
On a game poll page (`/#/games/:game_slug/polls/:id`), players should be able to see who voted for each option, via a small avatar next to the option, plus a vote count per option.

## Problem
The `GET /games/:game_slug/polls/:id/votes.json` endpoint already exists (`backend/games/views/polls/game_poll_votes.py`), but its serializer (`PollVoteSerializer`, `backend/games/serializers/games/polls/poll_vote.py`) only returns raw `id`, `option`, and `user` (FK id) fields — no user name/avatar and no vote counts. The `PollDetailSerializer` doesn't expose vote counts either.

On the frontend, `GamePoll.jsx` / `GamePollHelper.jsx` never even fetches the votes endpoint today — options are rendered as a plain list or a vote form, with no indication of who voted or how many votes each option has.

There is no anonymity/secrecy concept on `Poll` (`PollVotePermission.check_view` already lets any player/GM see the full vote list), so no new access-control restriction is introduced by exposing this data.

## Expected Behavior
- On loading a poll page, the frontend fetches `/games/:game_slug/polls/:id/votes.json`.
- Each option shows a small avatar for every user who voted for it (reusing the existing `Avatar` component, `frontend/assets/js/components/common/Avatar.jsx`).
- Each option shows its vote count, computed for every poll option (including options with zero votes, so the frontend can render a count for all of them in one pass — not only options that received at least one vote).

## Solution
Change the `GET` response of `/games/:game_slug/polls/:id/votes.json` to the array-based payload shape:

```json
{
  "votes_count": [
    {"option": "<option>", "count": "<votes count>"}
  ],
  "users": [
    {"id": "<user id>", "name": "<user name>", "avatar_url": "<user avatar url>"}
  ],
  "votes": [
    {"id": "<vote id>", "option": "<option>", "user_id": "<user_id>"}
  ]
}
```

- `votes_count` lists every option on the poll with its vote count (0 if unvoted).
- `users` lists only the users who cast at least one vote, following the existing `name`/`avatar_url` pattern already used for session chat messages (`SessionMessageUserSerializer`, `backend/games/serializers/games/sessions/messages/session_message_user.py`), including its Gravatar-based `avatar_url` build.
- `votes` keeps the existing per-vote option/user linkage (renamed `user` to `user_id` to match the new payload), so the frontend can join `votes` against `users` to render an avatar next to each option.

On the frontend, `GamePollHelper.jsx` fetches this payload and renders, per option: the vote count plus one `Avatar` per voter (joining `votes` to `users` by `user_id`).

The `PUT` endpoint (vote casting) is unaffected — this change only affects the `GET` response shape.

## Benefits
- Players can see at a glance who voted for what and how many votes each option has, directly on the poll page.
- Reuses existing, already-vetted patterns (`Avatar` component, Gravatar-based user serialization) instead of introducing new ones.
