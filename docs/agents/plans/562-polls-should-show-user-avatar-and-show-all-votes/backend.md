# Backend Plan: Polls should show user avatar and show all votes

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the envelope described in [plan.md](plan.md)'s "Shared contracts" section from
`GET /games/:game_slug/polls/:id/votes.json`:

```json
{
  "votes_count": [{"option": <option id>, "count": <int>}],
  "users": [{"id": <user id>, "name": "<username>", "avatar_url": "<url or null>"}],
  "votes": [{"id": <vote id>, "option": <option id>, "user_id": <user id>}]
}
```

- `votes_count`: every option on the poll, never filtered by `?user_id=`.
- `users`/`votes`: scoped to whatever `votes` queryset the existing `?user_id=` filter
  produces (unchanged filter behavior).

The `PUT` response keeps returning a flat list of `{id, option, user_id}` (same rename, no
envelope) — `SinglePollVoteWriter`/`MultiplePollVoteWriter` and `_cast_votes` are otherwise
untouched.

## Implementation Steps

### Step 1 — Rename `PollVoteSerializer`'s `user` field to `user_id`

`backend/games/serializers/games/polls/poll_vote.py:8-15` currently exposes `['id', 'option',
'user']` with `user` as the plain FK id. Change it to expose `user_id` instead (same
underlying value, e.g. `serializers.IntegerField(source='user_id')`), keeping `id`/`option`
as-is. This affects both the `GET` envelope's `votes` list and the `PUT` response — both are
fine with the rename since neither the `castVotes` frontend code nor any other consumer reads
the `user` key by name (only `option`).

### Step 2 — Add a poll voter (user) serializer

New file `backend/games/serializers/games/polls/poll_vote_user.py`, exposing `id`, `name`
(`user.username`), `avatar_url` (Gravatar, via `UserProfile`/`GravatarUrlBuilder` — same
pattern as `SessionMessageUserSerializer`,
`backend/games/serializers/games/sessions/messages/session_message_user.py:9-22`). Prefer
subclassing/extending `SessionMessageUserSerializer` to add the `id` field rather than
duplicating the `get_name`/`get_avatar_url` logic verbatim, if that composes cleanly; a plain
duplicate `serializers.Serializer` is an acceptable fallback if subclassing feels forced.

### Step 3 — Add a per-option vote-count serializer

New file `backend/games/serializers/games/polls/poll_option_vote_count.py`: a plain
`serializers.Serializer` exposing `option` (the `PollOption` id, e.g.
`serializers.IntegerField(source='id')`) and `count` (`serializers.IntegerField()`), meant to
serialize `PollOption` rows annotated with a vote count (see Step 4).

### Step 4 — Build the envelope in the view

In `backend/games/views/polls/game_poll_votes.py`, change `_list_votes` (lines 40-44) to:

1. Keep the existing `_PollVoteQuerySet(poll).filter_by_user_id(...)` call for the `votes`
   queryset (unchanged filter semantics).
2. Compute `poll.options.annotate(count=Count('votes'))` (import `Count` from
   `django.db.models`) for `votes_count` — this covers every option, including zero-vote ones,
   since it's driven by `poll.options`, not by the votes queryset.
3. Compute the distinct `User` set backing the (filtered) `votes` queryset — e.g.
   `User.objects.filter(poll_votes__in=votes_queryset).distinct()` (import `User` from
   `django.contrib.auth.models`) — for `users`.
4. Serialize each with the serializers from Steps 1-3 and return
   `{'votes_count': ..., 'users': ..., 'votes': ...}` via the existing `_skip_cache_response`
   helper.

`_cast_votes` (lines 47-65) stays as-is except for whatever the `PollVoteSerializer` rename in
Step 1 already changes automatically (its `user` key becomes `user_id`).

### Step 5 — Update tests

- `backend/games/tests/views/polls/game_poll_votes_test.py`: update existing `GET` assertions
  for the new envelope shape (including `user_id` instead of `user` in `votes`, and the `PUT`
  response's `user_id` rename); add coverage for: zero-vote options appearing in `votes_count`
  with `count: 0`; `votes_count` staying full-poll even when `?user_id=` is passed; `users`
  only including voters present in the (possibly filtered) `votes` result; a `multiple`-type
  poll where one user votes for more than one option.
- Add tests for the two new serializers if the project's convention is to unit-test
  serializers individually (check sibling files under
  `backend/games/tests/serializers/games/polls/` for the existing pattern and mirror it).

### Step 6 — Update the access-control doc

`docs/agents/access-control/poll.md`'s "Exposed fields" section (around lines 37-46)
describes `PollVoteSerializer` as `id, option, user` (plain FK ids) for both Vote List and
Vote Cast. Update it to describe the new envelope for Vote List (`votes_count`/`users`/
`votes`, with `votes` now `id, option, user_id`) and the still-flat-but-renamed Vote Cast
response (`id, option, user_id`).

## Files to Change

- `backend/games/serializers/games/polls/poll_vote.py` — rename `user` → `user_id`
- `backend/games/serializers/games/polls/poll_vote_user.py` — new voter serializer
- `backend/games/serializers/games/polls/poll_option_vote_count.py` — new per-option count serializer
- `backend/games/views/polls/game_poll_votes.py` — build the new `_list_votes` envelope
- `backend/games/tests/views/polls/game_poll_votes_test.py` — updated/new coverage
- `docs/agents/access-control/poll.md` — updated "Exposed fields" section

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_rest`, `pytest_all`)
- `backend/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- No migration needed — no model changes, only serializer/view changes.
- Confirm with `data-access`/`security` review (not part of this plan) that exposing voter
  identity here doesn't need a new permission check — per `docs/agents/access-control/poll.md`,
  `PollVotePermission.check_view` already allows any permitted viewer to see every vote for
  the poll, so this is a payload-shape change only, not an access-control change.
