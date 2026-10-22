# Token Scopes

What a scoped API token (`accounts.ApiToken`, see [ApiToken](api-token.md)) is allowed to do,
and how every endpoint enforces it. Who may manage tokens is in [ApiToken](api-token.md).

**Status.** The catalogue, the authentication-time check and the `@token_scopes` decorator are
in place. The PC family (`games/<slug>/pcs…`, every route nested under a PC, PC photos and the
reverse-nested PC summaries) is declared (#1631), and so is the NPC family
(`games/<slug>/npcs…`, every route nested under an NPC, NPC photos and the reverse-nested NPC
summaries) (#1632), and so is the documents family (`games/<slug>/documents…`, including
document pages, files, photos and their upload inits) (#1633). The factions family
(`games/<slug>/factions…`, the faction photo upload init, the faction characters listings and
`permissions/game_faction.json`) and the tasks family (`games/<slug>/tasks…`) are declared too
(#1634). The items, possessions, common items and recipes families (`games/<slug>/items…`,
`possessions…`, `common_items…` and `recipes…`, with their photo upload inits, the common item →
recipes and recipe → characters listings, and `permissions/game_item.json`,
`game_possession.json`, `game_common_item.json` and `game_recipe.json`) are declared as well
(#1635). The games family (`games.json`, `my-games.json`, `games/<slug>.json`,
`games/<slug>/access.json` and `permissions/game.json`), the players family
(`games/<slug>/players.json` and `players/<id>.json`) and the conversations family
(`games/<slug>/conversations.json`) are declared (#1630). The sessions family
(`games/<slug>/sessions…`, with the past / future / unscheduled listings and the session
messages) and the polls family (`games/<slug>/polls…`, votes, close and
`sessions/<id>/poll.json`) are declared (#1637). The treasures family
(`games/<slug>/treasures…`, the top-level `treasures.json`, `treasures/<id>.json`,
`treasures/<id>/access.json` and `treasures/<id>/photo_upload.json`, and
`permissions/treasure.json` and `permissions/game_treasure.json`) is declared (#1636). The
miniatures family (`miniatures/sources…`, `miniatures/stl_models…` and
`miniatures/collections…`, with their imports and photo upload inits) is declared (#1638).
Upload finalize (`uploads/<type>/<id>.json`) is declared and checks tokens in the view (#1639,
see [Uploads](#uploads)). Every other view, including the game photos and their upload init
(#1665), `permissions/game/pc.json`, `permissions/game/npc.json` and
`permissions/game_document.json` (#1666), is still on the coverage test's pending list, and
#1665 and #1666 add the remaining declarations. Until a view is declared,
it refuses every scoped token with `403` `token_not_allowed` (fail closed). The rules below are
the ones those declarations must follow.

## Intersection with the owner's roles

A request made with a scoped token succeeds only if **both**:

- the owner's existing role rules allow it (see [`access-control.md`](../access-control.md) and
  [`permissions.yaml`](../permissions.yaml)); views still run their normal checks as the owner;
- the token carries every scope the endpoint declares for the request method.

A token never grants more than its owner has. The owner's role still picks the regular or
restricted variant; tokens add no separate variant dimension. Token scopes add no role, so
`permissions.yaml` has no token rows.

## Catalogue

`backend/accounts/scopes.py` is the single source: 16 `FAMILIES` × `ACTIONS` (`read`, `write`),
giving the 32 scopes `<family>:<action>`. Token creation validates against it, and
`GET /account/api_tokens/options.json` serves it to the UI, so the frontend keeps no copy.

| Family | Covers (URL roots) | Game-scoped |
|---|---|---|
| `games` | `games.json`, `my-games.json`, `games/<slug>.json`, `games/<slug>/access.json`, `permissions/game.json` | yes |
| `players` | `games/<slug>/players…` | yes |
| `pcs` | `games/<slug>/pcs…` and every route nested under a PC | yes |
| `npcs` | `games/<slug>/npcs…` and every route nested under an NPC | yes |
| `documents` | `games/<slug>/documents…` (pages, files, `bump_version`) | yes |
| `factions` | `games/<slug>/factions…` | yes |
| `items` | `games/<slug>/items…` | yes |
| `common_items` | `games/<slug>/common_items…` | yes |
| `possessions` | `games/<slug>/possessions…` | yes |
| `recipes` | `games/<slug>/recipes…` | yes |
| `treasures` | `games/<slug>/treasures…` and the top-level `treasures/…` | game copies yes; top-level no |
| `sessions` | `games/<slug>/sessions…` (with messages) | yes |
| `polls` | `games/<slug>/polls…`, `sessions/<id>/poll.json`, votes | yes |
| `tasks` | `games/<slug>/tasks…` | yes |
| `conversations` | `games/<slug>/conversations.json` | yes |
| `miniatures` | `miniatures/sources`, `stl_models`, `collections` (with imports) | no |

- PCs and NPCs are separate families, so an automation generating NPCs can hold `npcs:write`
  without touching the players' characters. Photos and uploads follow their parent family.
- `METHOD_ACTIONS` maps `GET` to `read` and `POST`, `PUT`, `PATCH`, `DELETE` to `write`. There
  is no `delete` action: if destructive actions ever need their own scope, it must be a new,
  additive scope for new endpoints only, since splitting `write` would break existing tokens.
- Stored scopes no longer in the catalogue are ignored at check time (`effective_scopes`), so
  they grant nothing.

## Read scopes

- **Public reads need no scope.** Plain, `AllowAny` routes declare an empty list: a token can
  always read what an anonymous visitor can. This relies on plain routes never returning more
  to a privileged caller than to an anonymous one (#1616).
- **Restricted reads need the `read` scope of every family in the response**: the
  `all.json` / `full.json` routes and every other permission-gated read. For example
  `npcs/<id>/documents/<doc>/full.json` needs `npcs:read` **and** `documents:read`. A scope never
  leaks another family's restricted data.
- **Recipes embed their output common item.** A GameEdit caller may give a recipe a hidden
  output and the recipe response then unmasks it, so `recipes/all.json`, `recipes/<id>/full.json`
  and recipe `POST` / `PATCH` also need `common_items:read`;
  `common_items/<id>/recipes/all.json` needs `common_items:read` **and** `recipes:read`.
- `permissions/*.json` and `…/access.json` are public reads: they only report what the caller's
  role may do.
- **`my-games.json` needs `games:read` alone.** It is the caller's own membership summary: the
  embedded PC and the conversation / unread counts need no `pcs:read` or `conversations:read`.
- **`conversations.json` needs `conversations:read` and `players:read`.** It is gated on the
  player `show` permission, and its `player_id` 404s reveal whether a player exists.
- **Session listings and detail are public; session messages are not.** `sessions.json`,
  `sessions/past.json`, `future.json`, `unscheduled.json` and `sessions/<id>.json` `GET` declare
  no scope, while `sessions/<id>/messages.json` `GET` needs `sessions:read` (members only).
- **Polls have no public read path**: `polls.json`, `polls/<id>.json` and
  `polls/<id>/votes.json` `GET` need `polls:read`.
- **`sessions/<id>/poll.json` needs `polls:write` alone.** It creates a poll; the session it
  attaches to is public data, so no `sessions:*` scope is needed.
- **Treasure listings and detail are public; the DM views are not.**
  `games/<slug>/treasures.json` and `treasures/<id>.json` `GET` (which exclude and 404 hidden
  copies), the top-level
  `treasures.json`, `treasures/<id>.json` and `treasures/<id>/access.json` `GET` declare no
  scope, while `treasures/all.json`, `treasures/missing.json` and `treasures/<id>/full.json`
  need `treasures:read`.
- **Miniatures reads are login-only, so they are restricted and need `miniatures:read`.** That
  covers `miniatures/sources.json`, `miniatures/sources/<id>.json`,
  `miniatures/stl_models.json`, `miniatures/stl_models/<id>.json`,
  `miniatures/collections.json` and `miniatures/collections/<id>.json` `GET`.

## Write scopes and link routes

- **A write needs `write` on the family it changes.** For link routes, that is the owning family,
  the one the URL nests under: `npcs/<id>/items/acquire.json` needs `npcs:write`,
  `games/<slug>/treasures/link.json` needs `treasures:write`. The linked family needs no
  `write`, since its content does not change.
- **Creating a record in another family is a write on that family too.** `pcs/<id>/items.json`
  `POST` creates a `GameItem`, so it needs `pcs:write` **and** `items:write`; the same goes for
  `possessions.json` `POST` (`possessions:write`) and the per-item photo upload, which creates a
  `GameItemPhoto` (`items:write`).
- **A write also needs `read` on every other family whose restricted data it touches.** The plain
  `acquire.json` only accepts non-hidden records, so it needs `npcs:write` alone;
  `acquire/all.json` can link a hidden document (and its 404s reveal whether one exists), so it
  needs `npcs:write` **and** `documents:read`. The same goes for `remove/all.json`.
  Updating a link row that may be hidden (e.g. `pcs/<id>/items/<item>.json` `PATCH`, which
  returns the `full.json` shape) needs the linked family's `read` too.
- `remove`, `sell` and `buy` are writes on the character's family.
- **Treasure writes need `treasures:write` alone**: `games/<slug>/treasures.json` `POST`,
  `treasures/<id>.json` `PATCH` and `link.json` `POST` (catalogue treasures have no hidden flag),
  and the top-level `treasures.json` `POST`, `treasures/<id>.json` `PATCH` and
  `treasures/<id>/photo_upload.json` `POST`. The views still apply their role checks: a DM
  holding `treasures:write` cannot create a top-level treasure, and the top-level `PATCH` stays
  limited to staff and superusers (superusers only on a game-exclusive treasure).
- **Miniatures writes need `miniatures:write` alone**: the `sources.json`, `stl_models.json` and
  `collections.json` `POST`, `stl_models/<id>.json` `PATCH`, `stl_models/import.json` and
  `collections/import.json` `POST`, and the three `…/<id>/photo_upload.json` `POST` (all under
  `miniatures/`). The views keep `require_staff`, so a non-staff owner holding
  `miniatures:write` still gets `403`.

## Per-game restriction

- A token may carry a list of games; an empty list means every game the owner can
  [reach](api-token.md#reachable-games), including games joined later.
- The game comes only from the `game_slug` URL kwarg; the authentication class does no object
  lookups. When the token has a list and the slug is not on it, the request gets `403`
  `game_not_allowed`. Routes game-scoped by other means must enforce the list in the view before
  they are declared.
- Requests with no `game_slug` (the top-level `treasures/…` and `miniatures/…` routes) are
  governed by scopes alone, except where the view resolves a game itself (below).
- The top-level `treasures/<id>.json` `PATCH` and `treasures/<id>/photo_upload.json` `POST` can
  act on a game-exclusive treasure (`treasure.game_id` set) without a `game_slug`, so the views
  enforce the list themselves (`accounts.token_games.check_token_game`): after the treasure
  lookup and before the role check, a token with a non-empty game list that does not include
  the treasure's game gets `403` `game_not_allowed`. Catalogue treasures (no owning game),
  sessions and legacy `Token` requests are unaffected.
- Upload finalize (`uploads/<type>/<id>.json` `PATCH`) has no `game_slug` either, so the view
  enforces the list itself on the game of the upload's linked object (see [Uploads](#uploads)).
- `games.json` is a public read and is not filtered. `games.json` `POST` needs `games:write`
  and, having no `game_slug`, gets no game-list check; a game created by a token with a game
  list is not reachable by that token afterwards.
- `my-games.json` has no `game_slug` either, so the view filters it itself: when the token has
  a non-empty game list, only those games are listed (and their conversation counts computed).
  An empty list, a session or a legacy `Token` lists every game.

## Uploads

- Upload flows follow the scope of the resource they attach to: uploading an NPC photo needs
  `npcs:write`.
- `PATCH uploads/<type>/<id>.json` (finalize) names neither the resource nor a `game_slug` in its
  URL, so it is declared `@token_scopes(PATCH=[])`: the empty list only lets scoped tokens reach
  the view, and `uploads.upload_token_scope_check.UploadTokenScopeCheck` enforces the real rule
  inside it. The check runs after the `X-Upload-Token`, owner, expiry and status checks and
  before the per-type role check, and does nothing for sessions and legacy `Token` requests.
- Uploads with a staff or copy origin get `403` `token_not_allowed`, whatever the scopes.
- Otherwise the scopes and game come from the upload's `content_object` through a fixed
  model → scopes map. Each entry matches the scopes of the init route that created the upload:

  | Model | Scopes | Game |
  |---|---|---|
  | `GamePhoto` | `games:write` | the photo's game |
  | `CharacterPhoto` | `npcs:write` for an NPC, else `pcs:write` | the character's game |
  | `CharacterItemPhoto` | `npcs:write` / `pcs:write` (following the character) + `items:write` | the character's game |
  | `GameItemPhoto` | `items:write` | the item's game |
  | `GamePossessionPhoto` | `possessions:write` | the possession's game |
  | `GameCommonItemPhoto` | `common_items:write` | the common item's game |
  | `GameFactionPhoto` | `factions:write` | the faction's game |
  | `GameDocumentPhoto`, `GameDocumentFile` | `documents:write` | the document's game |
  | `GameDocumentFilePhoto` | `documents:write` | the game of the document whose file holds the photo |
  | `TreasurePhoto` | `treasures:write` | the treasure's game (none for a catalogue treasure) |
  | `SourcePhoto`, `StlModelPhoto`, `CollectionPhoto` | `miniatures:write` | none |

- A model missing from the map, or a `GameDocumentFilePhoto` not attached to exactly one file,
  fails closed with `token_not_allowed`. A missing scope gives `scope_missing`; then, as in
  [Per-game restriction](#per-game-restriction), a game off the token's list gives
  `game_not_allowed` (objects with no game pass).
- The role check still applies afterwards: miniatures photos stay staff-only, so a non-staff
  owner's token with `miniatures:write` still gets `403`.

## Never reachable with a scoped token

`EXCLUDED_ROUTE_PREFIXES` (`account/`, `users/`, `staff/`, `admin/`) refuse every scoped token
with `403` `token_not_allowed`, checked before any declaration, so a declaration there is
ignored. That covers token management (also guarded in the views by `require_session`, see
[ApiToken](api-token.md#actions)), account data, users and authorization requests, every staff
endpoint (there are no staff scopes) and the Django admin.

Views with `@authentication_classes([])` (`ready.json`, `domain/config.json`,
`users/status.json`, `users/header_status.json`, `access-route-config.json`) ignore every
credential and are unaffected.

## Enforcement

- **Where.** `ApiTokenAuthentication` (`backend/accounts/authentication.py`) runs
  `TokenScopeCheck` right after the token authenticates (DRF authenticates in `initial()`,
  before the view body). It reads the declaration from the resolved view
  (`request.resolver_match.func`). Checking in the authentication class means views overriding
  `permission_classes` cannot skip it.
- **Order.** Excluded prefix → declaration for the method → `scope_missing` → `game_not_allowed`.
- **Fail closed.** No declaration, no entry for the method, `OPTIONS` (which cannot be
  declared), an excluded prefix or an unresolved request all give `403` `token_not_allowed`.
  `HEAD` follows the `GET` entry. A new endpoint therefore never silently opens to tokens.
- **Coverage test.** `backend/accounts/tests/token_scopes_coverage_test.py` walks every URL
  pattern: each DRF view must be excluded (prefix or `authentication_classes == []`), declare
  every method it serves (except `OPTIONS` and `HEAD`), or be in `PENDING_TOKEN_SCOPES`. A new
  view without a declaration fails CI.

### Declaring scopes on a view

`backend/games/decorators.py` provides `token_scopes(**methods)`. Put it **above** `@api_view`
(it can be stacked in any order with `@restricted`, `@regular` and `@skip_cache`), with one
entry per method the view serves, each listing every scope required:

```python
@token_scopes(GET=[], POST=['documents:write'], DELETE=['documents:write'])
@api_view(['GET', 'POST', 'DELETE'])
def some_documents_view(request, game_slug):
    ...
```

- An empty list declares a public read that needs no scope.
- The decorator raises `ValueError` at import time for a non-DRF view, an unknown method or
  scope, a non-list value, a method the view does not serve, or an empty declaration.
- When declaring a pending view, remove it from `PENDING_TOKEN_SCOPES` in the same PR, and
  follow the read and write rules above.

## Error responses

Scope failures give **403** with the standard body `{"errors": {"detail": ["<code>"]}}`
(rendered by `backend/common/exception_handler.py` from the `ApiTokenForbidden` subclasses):

| Code | Meaning |
|---|---|
| `scope_missing` | The token lacks a required scope. |
| `game_not_allowed` | The request's `game_slug` is not on the token's game list. |
| `token_not_allowed` | The route is excluded, or the view declares no scopes for the method. |

There is no 404 masking: a disallowed game's slug is already public through `games.json`.
Authentication failures stay **401** `token_invalid` (see
[ApiToken](api-token.md#token-format-and-authentication)).
