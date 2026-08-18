# Poll

**[Game resource](principles.md#resource-categories).** A `Poll` is a game-scoped question with a
fixed set of `PollOption`s, created by (and visible to) a game's participants. `PollVote` links a
`User` (not a `Player`) to the option they voted for — so a game's DM(s), who have no `Player`
row, can vote too.

Unlike the [default resource CRUD pattern](principles.md#default-resource-crud-pattern), List is
not `AllowAny` and Create is not gated by a plain `<Resource>Edit` rule: view and create share the
**exact same** permission rule (**PollPermission**) — contrast with
[GameSessionMessage](game-session-message.md), whose create check is stricter than its view check.

| Action | Who can |
|--------|---------|
| List (`GET /games/<game_slug>/polls.json`) | **PollPermission.check** — roles per [`poll/endpoints.yml`](../../../backend/games/permissions/config/poll/endpoints.yml) (`regular.view_create`) |
| Show (`GET /games/<game_slug>/polls/<id>.json`) | Same as List |
| Create (`POST /games/<game_slug>/polls.json`) | Same as List — no stricter create-only rule |
| Session-scoped Create (`POST /games/<game_slug>/sessions/<session_id>/poll.json`) | Same as List/Create, reused verbatim |
| Update/Delete | Not exposed by any endpoint (Django admin only) |
| Vote List (`GET /games/<game_slug>/polls/<id>/votes.json`) | **PollVotePermission.check_view** — roles per [`poll_vote/endpoints.yml`](../../../backend/games/permissions/config/poll_vote/endpoints.yml) (`regular.show`). Optional `?user_id=` filter (any user id, not restricted to requester) |
| Vote Cast (`PUT /games/<game_slug>/polls/<id>/votes.json`) | **PollVotePermission.check_vote** — roles per the same file's `regular.vote` (`no_shortcut: true`, so **no** superuser/staff bypass, unlike the view checks above) |

## Pagination/filters

Standard numbered-page pagination. List accepts an optional `?status=` filter
(`open`/`inactive`/`closed`); an unrecognized value yields an empty page (tolerant convention, no
`400`).

## Cache

Always sets `X-Skip-Cache: true` on every response (List/Show/Create/Vote List/Vote Cast), per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule).

## Fields

**List**: `id`, `title`, `type`, `status` — no `description`/`options`, per the [list/show
default](principles.md#listshow-serializer-defaults). **Show/Create-response**: adds
`description`, `option_type`, `options` (nested `id`, `option` — no vote counts/voter identities).

**Vote List response** is an envelope, not a flat array: `{votes_count, users, votes}`.

- `votes_count`: one entry per option, always (including zero-vote), never filtered by
  `?user_id=`. Fields: `option`, `count`.
- `users`: distinct users backing the (`?user_id=`-filtered) `votes` below. Fields: `id`, `name`
  (`UserProfile.display_name`, never the real username), `avatar_url` (Gravatar-based).
- `votes`: per-vote rows, respecting `?user_id=`. Fields: `id`, `option`, `user_id` (plain FK ids).

**Vote Cast response**: a flat array (not the envelope) of `id`, `option`, `user_id`.

## Write fields

**Create**: `title` (required), `description` (optional), `type` (optional, defaults to single),
`option_type` (optional, defaults to text — applies to the whole poll), `options` (required, at
least one, capped at `MAX_OPTIONS`). `game` is always server-assigned; `status` is always
force-set to open on create, regardless of the model's own default, since no status-change
endpoint exists yet.

**Session-scoped create**: `dates` (required, non-empty, capped at `MAX_OPTIONS`), `type`
(optional, defaults to multiple — differs from the generic endpoint's single default, since a
session date poll commonly gathers several dates). `game`/session/`status`/`option_type`/`title`
are all server-assigned (`status` open, `option_type` date, `title` fixed to
`"Next session date"`) — none caller-settable here, unlike the generic create endpoint.

**Vote cast**: `option_ids` (required list of ints; each must belong to the poll's own options,
else `400`; an empty list clears the requester's vote(s)). `single`-type polls keep at most one
`PollVote` row per user (switching updates it in place); `multiple`-type diffs against existing
rows. Membership is enforced at the model level: a vote requires the user be a player of the
poll's game (a DM's own `Player`-less status doesn't block them, since DM is itself derived from a
`Player` row with `is_dm=True`). `unique_together = [('user', 'option')]`.
