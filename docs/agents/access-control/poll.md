# Poll

A `Poll` is a game-scoped question with a fixed set of `PollOption`s, created by (and visible
to) a game's participants. `PollVote` (linking a `Player` to the option they voted for) exists
at the model level but has no endpoint yet — voting is out of scope until a future issue.

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
| Update/Delete | Not exposed by any endpoint (Django admin only, out of scope) |
| Vote (`PollVote`) | Not exposed by any endpoint — tracked separately, out of scope for this feature |

**Pagination**: standard numbered-page `Paginator` (same as `game_treasures`/`game_tasks`), not
`SessionMessagePaginator`. List accepts an optional `?status=` filter (`open`/`inactive`/
`closed`), applied via a plain equality filter with no validation against `Poll.STATUS_CHOICES` —
an unrecognized value yields an empty page rather than a 400, matching the tolerant convention
already used by `?allegiance=`/`?slain=` elsewhere.

**Cache**: `X-Skip-Cache: true` is always set on all three responses (List/Show/Create) — see
[Common Rules](common-rules.md) for the cache-bypass mechanism. On the frontend, `PollClient`
(`frontend/assets/js/client/PollClient.js`) explicitly sends the `X-Skip-Cache` request header on
every GET call (`fetchPolls`/`fetchPoll`) rather than relying on the static suffix-matching
config in `skipCacheSuffixes.js` — the per-id `polls/<id>.json` shape can't be expressed as a
fixed suffix, the same reasoning already applied to the NPC-only case in `CharacterClient.js`.

**Exposed fields**:

- List (`PollListSerializer`): `id`, `title`, `type`, `status` — no `description`/`options`,
  kept light for the list surface.
- Show/Create-response (`PollDetailSerializer`): `id`, `title`, `description`, `type`, `status`,
  `option_type`, `options` (nested, `PollOptionSerializer`: `id`, `option` — no vote counts or
  voter identities, since `PollVote` isn't surfaced yet).

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
