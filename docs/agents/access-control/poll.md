# Poll

A `Poll` is a game-scoped question with a fixed set of `PollOption`s, created by (and visible
to) a game's participants. `PollVote` links a `User` (not a `Player`) to the option they voted
for — re-pointed from `Player` in #548 so a game's DM(s), who have no `Player` row, can vote too
— and is now exposed via a dedicated `GET`/`PUT .../votes.json` endpoint (see the Vote row below).

Unlike most other game sub-resources, view and create share the **exact same** permission rule
(**PollPermission**), rather than create being stricter (contrast with
[GameSessionMessage](game-session-message.md), whose create check excludes the
superuser/staff bypass that its view check allows) or view being open to everyone
(contrast with [GameSession](game-session.md)/[Task](task.md), which use GameEdit-style rules).

| Action | Who can |
|--------|---------|
| List (`GET /games/<game_slug>/polls.json`) | Player of the game, that game's GameMaster, Superuser, or Staff (`is_staff`) — **PollPermission.check**; 401 if unauthenticated, 403 if authenticated but none of the above; 404 if the game slug is unknown |
| Show (`GET /games/<game_slug>/polls/<id>.json`) | Same as List — **PollPermission.check**; 404 if the game slug or poll id is unknown, or the poll does not belong to that game |
| Create (`POST /games/<game_slug>/polls.json`) | Same as List — **PollPermission.check**; no stricter create-only rule (a deliberate divergence from `SessionMessagePermission`, per the issue's explicit permission list) |
| Session-scoped Create (`POST /games/<game_slug>/sessions/<session_id>/poll.json`) | Same as List/Create — **PollPermission.check**, same rule reused verbatim (the view's own `@permission_classes([AllowAny])` is intentional; authorisation is enforced inline via this same check, not by DRF's decorator); 404 if the game slug or session id is unknown, or the session does not belong to that game |
| Update/Delete | Not exposed by any endpoint (Django admin only, out of scope) |
| Vote List (`GET /games/<game_slug>/polls/<id>/votes.json`) | Player of the game, that game's GameMaster, Superuser, or Staff (`is_staff`) — **PollVotePermission.check_view**; 401 if unauthenticated, 403 if authenticated but none of the above; 404 if the game slug or poll id is unknown, or the poll does not belong to that game. Accepts an optional `?user_id=` filter (any `auth.User` id, not restricted to the requester's own); omitted or non-numeric, returns every vote for the poll |
| Vote Cast (`PUT /games/<game_slug>/polls/<id>/votes.json`) | Only an actual player or GameMaster of the game — **PollVotePermission.check_vote**; unlike the view check above, there is **no** superuser/staff bypass, so a pure admin gets 403 just like an unrelated user. Body: `{"option_ids": [...]}`, the full set of options the requester is casting; each id must belong to the poll's own options (400 otherwise). Response: 200 with the requester's own resulting votes only |

**Pagination**: standard numbered-page `Paginator` (same as `game_treasures`/`game_tasks`), not
`SessionMessagePaginator`. List accepts an optional `?status=` filter (`open`/`inactive`/
`closed`), applied via a plain equality filter with no validation against `Poll.STATUS_CHOICES` —
an unrecognized value yields an empty page rather than a 400, matching the tolerant convention
already used by `?allegiance=`/`?slain=` elsewhere.

**Cache**: `X-Skip-Cache: true` is always set on all responses (List/Show/Create/Vote List/Vote
Cast) — see [Common Rules](common-rules.md) for the cache-bypass mechanism. On the frontend,
`PollClient` (`frontend/assets/js/client/PollClient.js`) explicitly sends the `X-Skip-Cache`
request header on every GET call (`fetchPolls`/`fetchPoll`) rather than relying on the static
suffix-matching config in `skipCacheSuffixes.js` — the per-id `polls/<id>.json` shape can't be
expressed as a fixed suffix, the same reasoning already applied to the NPC-only case in
`CharacterClient.js`.

**Exposed fields**:

- List (`PollListSerializer`): `id`, `title`, `type`, `status` — no `description`/`options`,
  kept light for the list surface.
- Show/Create-response (`PollDetailSerializer`): `id`, `title`, `description`, `type`, `status`,
  `option_type`, `options` (nested, `PollOptionSerializer`: `id`, `option` — no vote counts or
  voter identities; `PollVote` is surfaced separately via its own `.../votes.json` endpoint,
  not nested here).
- Vote List response is an envelope, not a flat array of votes:
  `{votes_count, users, votes}`.
  - `votes_count` (`PollOptionVoteCountSerializer`): one entry per poll option, **always** —
    including zero-vote options — and never filtered by `?user_id=`, since a per-user tally
    wouldn't be meaningful. Fields: `option` (the `PollOption` id) and `count`.
  - `users` (`PollVoteUserSerializer`): the distinct users backing the (`?user_id=`-filtered)
    `votes` list below — i.e. only users who cast at least one vote captured there. Fields:
    `id`, `name` (`UserProfile.display_name`, not the voter's real `username`/login credential),
    `avatar_url` (Gravatar-based, same pattern as `SessionMessageUserSerializer`; `None` if the
    user has no email hash).
  - `votes` (`PollVoteSerializer`): the same per-vote rows as before, still respecting the
    `?user_id=` filter. Fields: `id`, `option`, `user_id` — both plain FK ids, not nested
    objects (`user_id` was renamed from `user`).
- Vote Cast response (`PollVoteSerializer`): a **flat array** (not the envelope above) of
  `id`, `option`, `user_id` — both plain FK ids, not nested objects.

**Write fields** (create, `PollCreateSerializer`): `title` (required, non-blank), `description`
(optional), `type` (optional, defaults to `Poll.TYPE_SINGLE`), `option_type` (optional, defaults
to `Poll.OPTION_TYPE_TEXT`; applies to the whole poll, not per-option — controls whether the
frontend renders/edits each option as plain text or as a date), `options` (required, at least one
entry, each `{option: str}` via `PollOptionWriteSerializer`, capped at `MAX_OPTIONS` — mirrors
`CharacterLinkWriteSerializer`'s `MAX_LINKS` bound). `game` is always assigned server-side from
the URL segment (via serializer `context`), never from the request body. `status` is always
force-set to `Poll.STATUS_OPEN` on create, regardless of the model's own default
(`Poll.STATUS_INACTIVE`) — since no status-change endpoint exists yet, a poll created any other
way could never become visible as "open" for the game-show-page widget.

**Write fields** (session-scoped create, `SessionPollCreateSerializer`): `dates` (required, a
non-empty list of `date`s, capped at `MAX_OPTIONS`), `type` (optional, defaults to
`Poll.TYPE_MULTIPLE` — note this differs from the generic create endpoint's `Poll.TYPE_SINGLE`
default, since a session date poll commonly needs to gather several dates that work for the
group). Unlike `PollCreateSerializer`, this is a plain `serializers.Serializer` (not a
`ModelSerializer`): `game` and the owning `GameSession` (`content_object`) are always assigned
server-side from the URL segments (via serializer `context`), never from the request body;
`status` is force-set to `Poll.STATUS_OPEN`, `option_type` to `Poll.OPTION_TYPE_DATE`, and
`title` to a fixed `"Next session date"` — none of these four are caller-settable here, unlike
the generic create endpoint where `option_type` (and effectively `title`) are caller-supplied.
Each date becomes one `PollOption` (`option` = the date's ISO string), created via `bulk_create`.

**Write fields** (vote cast, `PollVoteWriteSerializer`): `option_ids` (required, a list of ints;
each must be an id of one of `poll`'s own options, else 400 — an empty list is valid and clears
the requester's vote(s)). Unlike the other poll serializers, this one is a plain
`serializers.Serializer`, not a `ModelSerializer` — persistence is delegated to
`SinglePollVoteWriter`/`MultiplePollVoteWriter` (`backend/games/poll_vote_writer.py`), selected
by `poll.type`, rather than to `.save()`:

- `single`-type: at most one `PollVote` row per user; switching the selected option updates that
  row's `option` field in place (never a delete followed by a create); an empty `option_ids`
  deletes the existing row instead.
- `multiple`-type: diffs `option_ids` against the user's existing rows for the poll — creates
  rows for newly selected options, deletes rows for options no longer selected, leaves unchanged
  ones untouched.

**Model**: `PollVote.user` is a `ForeignKey` to `auth.User` (`related_name='poll_votes'`),
**not** `games.Player` — a game's GameMaster(s) have no `Player` row, so pointing votes at
`Player` would leave DM-only users unable to vote. `PollVote.clean()`'s membership check is
"user is a player or game master of `poll.game`"
(`game.players.filter(user=user).exists() or game.game_masters.filter(user=user).exists()`),
mirroring `PollVotePermission`'s own check. `unique_together = [('user', 'option')]`.
