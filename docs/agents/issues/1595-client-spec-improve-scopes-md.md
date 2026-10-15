# Issue: Client spec: improve scopes.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Review
`docs/agents/specs/client/scopes.md`, written in #1593, and settle every open question on the
scope catalogue, the enforcement mechanism, the intersection with owner roles, the per-game
restriction and the exclusions, so the page can drive #1603 (scope enforcement).

## Problem

`scopes.md` leaves its core design open: the full catalogue, how endpoints declare and enforce
scopes, how the game of a request is found, the error responses, and how scopes are stored on
`ApiToken`. The epic also listed a `delete` action that this issue drops.

## Expected Behavior

- `docs/agents/specs/client/scopes.md` records every decision below under **Decisions**, has
  **Open questions: None**, and lists the affected code.
- The `read`/`write`/`delete` wording becomes `read`/`write`: `scopes.md` (the actions list and
  the HTTP-method mapping, where `DELETE` now maps to `write`) and `token-ui.md` (the picker
  question's "read/write/delete columns").
- The hub `docs/agents/specs/client.md` records that #1616 must land before #1603, and that #1603
  gets `security` and `data-access` reviews.

## Solution

### Resource families

Families follow the access-control resource pages (`docs/agents/access-control/*.md`), so scopes
line up with the role rules they intersect with. All 16 are kept separate (the token UI may group
them visually).

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
  `npcs:write` without being able to touch players' characters.
- Photos and uploads follow their parent family.
- Rejected: merging `sessions`/`polls`/`conversations` or the inventory families.

### Actions

- **Only `read` and `write`.** There is no `delete` action: HTTP `DELETE` maps to `write`. Every
  family gets both, so the catalogue is the 32 scopes `<family>:read` / `<family>:write`.
- Today only two non-staff, non-account `DELETE` endpoints exist: trimming a document's pages
  (`documents/<id>/pages.json`, `pages/all.json`) and deleting a character photo
  (`pcs|npcs/<id>/photos/<photo_id>.json`). Both need the family's `write`.
- **Accepted consequence:** splitting `delete` out of `write` later would break existing
  `write` tokens. If destructive actions ever need their own scope, it must be a new, additive
  scope for new endpoints only.
- Rejected: a `delete` action for every family (most would do nothing), or only where a
  `DELETE` endpoint exists (not worth it for two endpoints).

### Read scopes

- **Public (plain, AllowAny) reads need no scope.** A scoped token can always read what an
  anonymous visitor can; requiring a scope there protects nothing.
- **Restricted reads (`all.json`/`full.json`, permission-gated) need the `read` scope of every
  family whose data the response contains.** `npcs/<id>/documents/<doc>/full.json` needs
  `npcs:read` **and** `documents:read`; `items/<id>/npcs/<id>/summary/all.json` needs
  `items:read` and `npcs:read`. A scope never leaks another family's restricted data.
- `permissions/*.json` and `…/access.json` are public reads: they only report what the
  caller's role may do.
- **Prerequisite: #1616.** The rule assumes a plain route never returns more to a privileged
  caller than to an anonymous one. Today the plain NPC detail and the NPC nested index endpoints
  (the hidden-NPC gate) serve hidden content to editors. #1616 moves that to the restricted
  routes, and must land before #1603.

### Write scopes and link routes

- **A write needs `write` on the family it changes.** For link routes that is the owning
  family: the one the URL nests under, whose collection grows or shrinks.
  `npcs/<id>/items/acquire.json` needs `npcs:write`; `games/<slug>/treasures/link.json` needs
  `treasures:write`. The linked family needs no `write`, because its content does not change.
- **A write also needs `read` on every other family whose restricted data it touches.** The
  plain `acquire.json` only accepts non-hidden records, so it needs `npcs:write` alone;
  `acquire/all.json` can link a hidden document (and its 404s reveal whether hidden documents
  exist), so it needs `npcs:write` + `documents:read`. Same for `remove/all.json`.
- **`remove`, `sell` and `buy` are `write`.** Unlinking edits the character's inventory, as
  linking does; `buy`/`sell` also change the character's money.
- Rejected: `write` on both sides of a link (an automation handing items to NPCs would also be
  allowed to rewrite every item: more power, not less). Rejected: dedicated link scopes
  (`npc_items:write`, …): about 14 extra scopes for little gain.

### Enforcement mechanism

- **Per-view decorator**, keyed by HTTP method, since some views serve several methods:
  `@token_scopes(GET=[], POST=['documents:write'], DELETE=['documents:write'])`. Each entry is
  the list of scopes required, all of them; an empty list declares a public read that needs no
  scope. It sits next to the existing `@regular`/`@restricted` markers.
- **Checked inside `ApiTokenAuthentication`.** DRF authenticates eagerly in `initial()`, before
  the view body. After the token passes its own checks, the Bearer class reads the declaration
  from the resolved view (`request.resolver_match.func`) and raises `PermissionDenied` (403)
  when the scopes or the game do not match.
- **Fail closed:** a view with no declaration, or no entry for the request's method, rejects
  every scoped token with 403. This holds even though views override `permission_classes`.
- The catalogue is a single constant in code, shared by the decorator, token creation and the
  token UI's list of options.
- Rejected: a central URL map (about 230 entries that drift from the views). Rejected: a
  `DEFAULT_PERMISSION_CLASSES` entry (every view sets `@permission_classes`, which overrides it).

### Per-game restriction

- **The game comes from the `game_slug` URL kwarg.** When the token carries a game list and
  the slug is not on it, the request gets 403. An empty list means every game the owner can reach.
- Top-level `treasures/…` and `miniatures/…` are not game-scoped: scopes alone govern them.
- `my-games.json` is filtered to the token's games. `games.json` is a public read and is not
  filtered.
- No object lookups in the authentication class.

### Upload finalize

- `PATCH uploads/<type>/<id>.json` does not name the resource in its URL. Its scope comes from
  the upload's `content_object` model through a fixed model-to-family map (`CharacterPhoto` to
  `pcs`/`npcs`, `GameDocumentFile`/`GameDocumentPhoto` to `documents`, `GameItemPhoto` to
  `items`, `SourcePhoto`/`StlModelPhoto`/`CollectionPhoto` to `miniatures`, …), needing that
  family's `write`. The game comes from that object. This is the one check done inside a view.
- Uploads with a staff or copy origin are rejected for scoped tokens.

### Error responses

- **403** with the existing body shape `{"errors": {"detail": ["<code>"]}}`:
  - `scope_missing`: the token lacks a required scope;
  - `game_not_allowed`: the request's game is not on the token's list;
  - `token_not_allowed`: the endpoint is excluded or declares no scopes.
- No 404 masking: a disallowed game's slug is already public through `games.json`.
- Authentication failures stay 401 `token_invalid` (see `tokens.md`).

### Storage and validation on `ApiToken`

- `scopes`: a `JSONField` list of strings, validated on creation against the catalogue
  constant. Unknown or duplicate entries give 400.
- `games`: an M2M to `Game`. Each game must be reachable by the owner, otherwise 400.
- If the catalogue later drops a scope, stored unknown scopes are ignored at check time
  (fail closed).

### Exclusions

- Scoped tokens get 403 `token_not_allowed` on `account/*`, `users/*` (including authorization
  requests), `staff/*`, `admin/` and token management.
- Views with `@authentication_classes([])` (`ready.json`, `domain/config.json`,
  `users/status.json`, `users/header_status.json`, `access-route-config.json`) ignore every
  credential and stay unchanged.

### Intersection with owner roles

Unchanged from the epic: a request succeeds only if the owner's role rules allow it **and** the
token carries the required scopes. The role still picks the regular or restricted variant.

### Testing strategy for #1603

- **Coverage test:** walk every URL pattern and assert each DRF view either declares
  `@token_scopes` for every method it serves or is on the explicit exclusion list. A new endpoint
  without a declaration fails CI.
- **Per-family tests:** missing scope (403 `scope_missing`), wrong game (403
  `game_not_allowed`), public read without scopes, restricted multi-family read, link writes,
  and the intersection with role (a scope never lets a token exceed its owner).
- Excluded routes give 403 `token_not_allowed`; upload finalize resolves its family from the
  linked object.

### Reviews

#1603 gets `security` and `data-access` reviews, as #1604 does.

## Acceptance criteria

- `docs/agents/specs/client/scopes.md` records every decision above and has no unresolved open
  questions.
- The client spec uses `read`/`write` only.
- The hub `docs/agents/specs/client.md` notes the #1616 prerequisite and the #1603 reviews.
