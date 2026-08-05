# Game

**[Game resource](principles.md#resource-categories).** Follows the [default resource CRUD
pattern](principles.md#default-resource-crud-pattern) (List/Detail = **AllowAny**, Update =
**GameEdit**, Delete = superuser-only via Django admin), with one deviation: **Create**
(`POST /games.json`) requires only any authenticated user, not **GameEdit** — there is no existing
GameMaster to authorize a brand-new game.

## Domain-scoped listing/creation (`ENABLE_GAMES_PER_DOMAIN`)

When the `ENABLE_GAMES_PER_DOMAIN` env-driven Django setting is on (default `false`, so the
behavior above is unaffected by default), `GET`/`POST /games.json` are additionally scoped to the
requesting domain, resolved from `request.get_host()` (see `USE_X_FORWARDED_HOST` below):

- The host is checked against `RegisteredDomainsCache.domains()` (the set of every
  `GameDomain.domain`, `games/caches/registered_domains_cache.py`). An unrecognized host gets
  `404` for both `GET` and `POST` — no game is listed or created.
- `GET` on a recognized host filters to `Game.objects.filter(id__in=DomainGamesCache
  .game_ids_for_domain(host))` (`#963`) before pagination — games not attached to that host's
  `GameDomainGroup` are invisible, even though no per-role restriction changes (a recognized-host
  visitor still sees the list under the same **AllowAny** rule as today, just narrowed to that
  domain's games).
- `POST` on a recognized host additionally attaches the newly created game to that host's
  `GameDomainGroup` (`game.game_domain_groups.add(...)`), so the creator immediately sees it back
  under the same domain — this is on top of, not instead of, the **Create** rule above.
- Both successful and `404` responses in this mode set `X-Skip-Cache: true` per the
  [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule), since the response body now varies by
  domain and Tent's file cache does not key on `Host`/`X-Forwarded-Host`.
- **Trust assumption**: domain resolution relies on `USE_X_FORWARDED_HOST = True`
  (`majora_project/settings.py`), which trusts the `X-Forwarded-Host` header set by the
  `darthjee/tent` proxy's `RenameHeaderMiddleware` (which unconditionally overwrites any
  client-supplied value with the actual `Host` it received — see
  `docs/agents/external/tent/host-header.md`). This is safe under this project's architecture
  where Tent is the sole entry point (see `docs/agents/architecture.md`/root `README.md`) and
  Django is never reached directly by an external client; `ALLOWED_HOSTS` itself is `*` by
  default and does not add a second layer of validation. If Django is ever exposed directly
  (bypassing Tent), this header becomes spoofable and the domain gate above would no longer be
  trustworthy — keep this assumption in mind before changing the deployment topology.

## Fields
List/detail (`GET /games.json`/`GET /games/<slug>.json`): `name`, `game_slug`, `description`,
`game_type`, links list, photos list, treasures list, `cover_photo_path` (see [Photo path
fields](common-rules.md#photo-path-fields)). `game_type` (`dnd`/`deadlands`, default `dnd`) and
`next_session` (`{title, date}|null` — the earliest-dated upcoming session, or the first
unscheduled session, or `null`) are detail-only, per the [list/show
default](principles.md#listshow-serializer-defaults).

**Write fields** (create/update): `name` (required for create), `description` (optional),
`game_type` (create-only, defaults to `dnd`, fixed thereafter), `links` (optional, update only —
see [Link](link.md#write-semantics)). `cover_photo_path`/`game_slug` are read-only,
server-assigned only (`game_slug` auto-generated from `name`; `cover_photo_path` set only via
[Upload](upload.md)).

## Regular access for mutation (issue #891)

`PATCH /games/<slug>.json` has two tiers, mirroring the [Character](character.md#regular-access-for-mutation)
regular/restricted split:
- Full tier (`name`+`description`+`links`) — **GameEdit**, i.e. the plain `Update` rule from the
  default CRUD pattern above (admin/dm shortcut only).
- Regular tier (`description`+`links` only — `name` is absent from the serializer's field set, so
  a `name` value sent by a regular-tier request is silently dropped, not merely rejected) —
  **GameRegularEdit**: roles per
  [`game/endpoints.yml`](../../../backend/games/permissions/config/game/endpoints.yml)'s
  `regular.regular_edit` (Staff + AnyPlayer, on top of the universal superuser/dm shortcut). The
  view tries the full-tier check first, falling back to the regular-tier check — see
  [common-rules](common-rules.md).

## Edit access status

`GET /games/<slug>/access.json` — **AllowAny**, standard shape per [Access status
endpoints](common-rules.md#access-status-endpoints-accessjson). `is_owner` is always `false`
(games have no ownership concept).

## Edit permission

`GET /permissions/game.json` — entity-agnostic (no path parameters, since #926), **AllowAny**,
standard shape per [Edit permission
endpoints](common-rules.md#edit-permission-endpoints-permissionsjson). Beyond `can_edit`
(**GameEdit**), exposes:
- `can_create_item` — **GameItemCreatePermission**: roles per
  [`game_item/endpoints.yml`](../../../backend/games/permissions/config/game_item/endpoints.yml)
  (`create`) — broader than `can_edit`. See [GameItem](game-item.md#item-creation-endpoint).
- `can_create_document` — same shape, roles per
  [`game_document/endpoints.yml`](../../../backend/games/permissions/config/game_document/endpoints.yml)
  (`create`). See [GameDocument](game-document.md#document-creation-endpoint).
- `can_edit_regular` (issue #891) — **GameRegularEdit**: roles per
  [`game/endpoints.yml`](../../../backend/games/permissions/config/game/endpoints.yml)'s
  `regular.regular_edit` — broader than `can_edit`, gates the `description`+`links`-only `PATCH`
  tier above.

## My Games list

`GET /my-games.json` — any authenticated user; `401` if unauthenticated. Always sets
`X-Skip-Cache: true` per the [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule) (per-viewer
data). Not paginated — bounded by how many games one user plays.

Returns one item per `Player` row belonging to the requester (every game they belong to, as player
or DM) — never another user's rows:

| Field | Type | Value |
|-------|------|-------|
| `game` | object | Same shape as `GET /games.json` (`name`, `game_slug`, `cover_photo_path`) |
| `role` | `"dm"` \| `"player"` | From that `Player` row's `is_dm` |
| `character` | object \| `null` | `name`, `photo_url` — see [Player](player.md) — or `null` when the role is `"dm"` or the player owns no PC yet in that game |
| `conversations.count` | int | Number of `Conversation`s the requester follows with at least one participant belonging to that game — see [Conversation](conversation.md) |
| `conversations.unread_count` | int | Subset of the above with at least one unread message for the requester |
