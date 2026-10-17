# Scopes

What a scoped token is allowed to do, and how every endpoint enforces it. Part of the
[client spec](../client.md) (epic #1592). Refined by #1595 and implemented by #1603.

## Overview

A scoped token never grants anything on its own. It only narrows what its owner can already do.
Each token carries a set of resource × action scopes and, optionally, a list of games. Every
endpoint must know which scope it needs, and any endpoint that does not declare one rejects
scoped tokens.

## Decisions

### Intersection with the owner's roles

A request made with a scoped token succeeds only if **both**:

- the owner's existing role rules allow it (admin, dm, owner, player, staff; see
  [`access-control.md`](../../access-control.md) and
  [`permissions.yaml`](../../permissions.yaml)); and
- the token carries the scopes the endpoint needs.

A token never grants more than its owner has. The owner's role still picks the endpoint variant
(regular or restricted), as it does today; tokens add no separate regular/restricted dimension.

### Resource families

Families follow the access-control resource pages (`docs/agents/access-control/*.md`), so scopes
line up with the role rules they intersect with. All 16 families are kept separate. The token UI
may group them visually.

| Family | Covers (URL roots) | Game-scoped |
|---|---|---|
| `games` | `games.json`, `my-games.json`, `games/<slug>.json`, `games/<slug>/access.json`, `permissions/game.json` | yes |
| `players` | `games/<slug>/players…` | yes |
| `pcs` | `games/<slug>/pcs…` and every route nested under a PC | yes |
| `npcs` | `games/<slug>/npcs…` and every route nested under an NPC | yes |
| `documents` | `games/<slug>/documents…` (pages, files, bump_version) | yes |
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

- **PCs and NPCs are separate families.** An automation that generates NPCs can hold
  `npcs:write` without being able to touch the players' characters.
- Photos and uploads follow their parent family.
- **Rejected:** merging `sessions`, `polls` and `conversations` into one family, or merging the
  inventory families (`items`, `common_items`, `possessions`, `recipes`, `treasures`).

### Actions

- **Only `read` and `write`.** There is no `delete` action. `GET` maps to `read`; `POST`, `PUT`,
  `PATCH` and `DELETE` map to `write`.
- Every family gets both actions, so the catalogue is the 32 scopes `<family>:read` and
  `<family>:write`, for example `npcs:read`, `npcs:write` or `documents:write`.
- Today only two non-staff, non-account `DELETE` endpoints exist: trimming a document's pages
  (`documents/<id>/pages.json`, `pages/all.json`) and deleting a character photo
  (`pcs|npcs/<id>/photos/<photo_id>.json`). Both need the family's `write`.
- **Accepted consequence:** splitting `delete` out of `write` later would break existing `write`
  tokens. If destructive actions ever need their own scope, it must be a new, additive scope for
  new endpoints only.
- **Rejected:** a `delete` action for every family (most would do nothing), or only where a
  `DELETE` endpoint exists (not worth it for two endpoints).

### Read scopes

- **Public reads need no scope.** Plain, `AllowAny` routes need nothing: a scoped token can
  always read what an anonymous visitor can, so requiring a scope there protects nothing.
- **Restricted reads need the `read` scope of every family in the response.** This covers the
  `all.json`/`full.json` routes and every other permission-gated read. For example:
  - `npcs/<id>/documents/<doc>/full.json` needs `npcs:read` **and** `documents:read`;
  - `items/<id>/npcs/<id>/summary/all.json` needs `items:read` **and** `npcs:read`.

  A scope never leaks another family's restricted data.
- `permissions/*.json` and `…/access.json` are public reads: they only report what the caller's
  role may do.
- **Prerequisite: #1616.** This rule assumes a plain route never returns more to a privileged
  caller than to an anonymous one. Today the plain NPC detail and the NPC nested index endpoints
  (the hidden-NPC gate) serve hidden content to editors. #1616 moves that to the restricted
  routes, and must land before #1603.

### Write scopes and link routes

- **A write needs `write` on the family it changes.** For link routes, that is the owning family:
  the one the URL nests under, whose collection grows or shrinks. For example:
  - `npcs/<id>/items/acquire.json` needs `npcs:write`;
  - `games/<slug>/treasures/link.json` needs `treasures:write`.

  The linked family needs no `write`, because its content does not change.
- **A write also needs `read` on every other family whose restricted data it touches.** The plain
  `acquire.json` only accepts non-hidden records, so it needs `npcs:write` alone.
  `acquire/all.json` can link a hidden document, and its 404s reveal whether hidden documents
  exist, so it needs `npcs:write` **and** `documents:read`. The same goes for `remove/all.json`.
- **`remove`, `sell` and `buy` are `write`.** Unlinking edits the character's inventory, as
  linking does; `buy` and `sell` also change the character's money.
- **Rejected:** `write` on both sides of a link. An automation handing items to NPCs would also be
  allowed to rewrite every item: more power, not less.
- **Rejected:** dedicated link scopes (`npc_items:write`, …): about 14 extra scopes for little
  gain.

### Enforcement mechanism

- **Per-view decorator, keyed by HTTP method,** since some views serve several methods:

  ```python
  @token_scopes(GET=[], POST=['documents:write'], DELETE=['documents:write'])
  ```

  Each entry lists the scopes required, all of them. An empty list declares a public read that
  needs no scope. The decorator sits next to the existing `@regular`/`@restricted` markers in
  `backend/games/decorators.py`.
- **Checked inside `ApiTokenAuthentication`.** DRF authenticates eagerly in `initial()`, before
  the view body runs. Once the token passes its own checks (see [Tokens](tokens.md)), the Bearer
  class reads the declaration from the resolved view (`request.resolver_match.func`) and raises
  `PermissionDenied` (403) when the scopes or the game do not match.
- **The catalogue is a single constant in code,** shared by the decorator, token creation and the
  token UI's list of options (served by
  [`options.json`](token-api.md#options-get-accountapi_tokensoptionsjson)).
- **Rejected: a central URL map.** About 230 entries that would drift away from the views.
- **Rejected: a `DEFAULT_PERMISSION_CLASSES` entry.** Every view sets `@permission_classes`,
  which overrides the default, so the check would never run.

### Fail closed

- A view with no `@token_scopes` declaration, or with no entry for the request's method, rejects
  every scoped token with 403 `token_not_allowed`.
- This holds even though views override `permission_classes`, because the check runs in the
  authentication class.
- Adding a new endpoint therefore never silently opens it to tokens.

### Per-game restriction

- A token can carry a list of games. An empty list means every game the owner can reach.
- **The game comes from the `game_slug` URL kwarg.** When the token carries a game list and the
  slug is not on it, the request gets 403 `game_not_allowed`.
- Requests that are not game-scoped (the top-level `treasures/…` and `miniatures/…` routes) are
  governed by scopes alone.
- `my-games.json` is filtered to the token's games. `games.json` is a public read and is not
  filtered.
- The authentication class does no object lookups: the slug is the only source of the game.

### Uploads

- Upload flows are not excluded. An upload follows the scope of the resource it attaches to: for
  example, uploading an NPC photo needs `npcs:write`.
- **Finalize.** `PATCH uploads/<type>/<id>.json` does not name the resource in its URL. Its scope
  comes from the upload's `content_object` model, through a fixed model-to-family map, and needs
  that family's `write`:

  | Model | Family |
  |---|---|
  | `CharacterPhoto` | `pcs` or `npcs`, following the character |
  | `GameDocumentFile`, `GameDocumentPhoto` | `documents` |
  | `GameItemPhoto` | `items` |
  | `SourcePhoto`, `StlModelPhoto`, `CollectionPhoto` | `miniatures` |
  | … | the family of the attached resource |

  The game comes from that object. This is the one check done inside a view rather than in the
  authentication class.
- Uploads with a staff or copy origin are rejected for scoped tokens.

### Error responses

- Scope failures give **403** with the existing body shape
  `{"errors": {"detail": ["<code>"]}}`:
  - `scope_missing`: the token lacks a required scope;
  - `game_not_allowed`: the request's game is not on the token's list;
  - `token_not_allowed`: the endpoint is excluded or declares no scopes.
- **No 404 masking.** A disallowed game's slug is already public through `games.json`.
- Authentication failures stay **401** `token_invalid` (see [Tokens](tokens.md)).

### Storage and validation

On `ApiToken` (see [Tokens](tokens.md)):

- **`scopes`:** a `JSONField` holding a list of strings, validated on creation against the
  catalogue constant. Unknown or duplicate entries give 400.
- **`games`:** a many-to-many to `Game`. Each game must be reachable by the owner, otherwise 400.
- If the catalogue later drops a scope, stored unknown scopes are ignored at check time, so they
  grant nothing (fail closed).

### Never reachable with a scoped token

Whatever scopes it carries, a scoped token gets 403 `token_not_allowed` on:

- **token management**: creating, listing, renaming or revoking tokens is session-only (see
  [Token API](token-api.md));
- **account data**: `account/*` (profile, password, email, login and logout);
- **users**: `users/*`, including authorization requests;
- **staff endpoints**: `staff/*` (cache, copy, crawler, photo and statistics). This epic defines
  no staff scopes;
- **Django admin**: `admin/`.

Views with `@authentication_classes([])` (`ready.json`, `domain/config.json`,
`users/status.json`, `users/header_status.json`, `access-route-config.json`) ignore every
credential, so they stay unchanged.

### Testing strategy

For #1603:

- **Coverage test.** Walk every URL pattern and assert that each DRF view either declares
  `@token_scopes` for every method it serves or is on the explicit exclusion list. A new endpoint
  without a declaration fails CI.
- **Per-family tests:** a missing scope (403 `scope_missing`), a wrong game (403
  `game_not_allowed`), a public read without scopes, a restricted multi-family read, link
  writes, and the intersection with the owner's role (a scope never lets a token exceed its
  owner).
- Excluded routes give 403 `token_not_allowed`.
- Upload finalize resolves its family from the linked object.

#1603 also gets `security` and `data-access` reviews, as #1604 does.

## Open questions

None. Every open question was settled by #1595 and recorded under [Decisions](#decisions).

## Affected code

- `backend/*/views*.py`: every API view, which must declare `@token_scopes` for each method it
  serves.
- `backend/games/decorators.py`: the `@token_scopes` decorator, next to `@regular` and
  `@restricted`.
- `backend/accounts/authentication.py`: `ApiTokenAuthentication` checks the token's scopes and
  games against the resolved view's declaration.
- `backend/accounts/`: the `scopes` and `games` fields on `ApiToken`, the scope catalogue
  constant, and their validation on creation.
- `backend/uploads/views.py`: the upload finalize view, which resolves its family from the
  upload's `content_object`.
- `backend/*/urls*`: every URL module, walked by the coverage test.
- [`permissions.yaml`](../../permissions.yaml) and
  [`access-control/`](../../access-control.md): the owner role rules that scopes intersect with.
- Staff, account, users and token management views: must reject scoped tokens outright.
