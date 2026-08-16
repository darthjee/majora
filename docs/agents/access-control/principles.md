# Permission Principles

Shared conventions that recur across multiple resources in this document set. Each is stated
once here; per-resource files (e.g. [Character](character.md)) link back to this file instead of
re-deriving the rationale, keeping only what's specific to that resource.

## Source of truth & access levels

The backend is the sole source of truth for who can access what — it is responsible for blocking
read or write access whenever the requester lacks it, never the frontend.

Roles, from broadest to narrowest scope:

1. **Superuser** — admin access on all pages.
2. **Staff** — staff access on all pages.
3. **Resource-scoped roles** — depend on the page/resource being accessed:
   - **`dm`** — GameMaster of the game in the resource path.
   - **`player`** — any player of the game in the resource path.
   - **`owner`** — the player who owns the character in the resource path.

These map directly onto the roles already defined in [User Roles](user-roles.md) — this is not a
new role vocabulary, just a description of how those roles rank relative to one another.

## Partial vs full access pattern

When a resource has two access classes — a wider-audience "partial" view and a narrower
"full" view — the backend exposes **two separate routes** for the same resource, rather than
branching a shared serializer or filter by the requester's role:

| Action | Partial route | Full route |
|--------|---------------|------------|
| Show | `GET .../:id.json` | `GET .../:id/full.json` |
| Update | — (not accepted), *or* a narrower, curated, player-writable field set gated by its own broader-audience permission (see below) | `PATCH .../:id/full.json` |
| Index | `GET ....json` | `GET .../all.json` |
| Create | `POST ....json` (curated field set, broader-audience permission) | `POST .../full.json` |

A requester lacking full access simply gets no access to the full-access route (401/403) — there
is no partial fallback response on that route.

For Character specifically, the partial route's `PATCH` is not a generic fallback — it accepts
only a small, curated field set (never the full-route's private-only fields), gated by its own
permission that is broader than the full route's but still requires at least "any player of the
game" (never `AllowAny`). See [Character](character.md)'s "Narrow player-facing NPC PATCH" and
"Narrow player-facing PC PATCH" sections for the concrete field sets and permissions.

## Default resource CRUD pattern

Absent a stated deviation, every top-level resource in this document set follows the same
List/Detail/Create/Update/Delete shape:

| Action | Who can |
|--------|---------|
| List | **AllowAny** |
| Detail | **AllowAny** |
| Create | The resource's own `<Resource>Edit` rule (e.g. `GameEdit`, `CharacterEdit`, `GameSessionEdit` — substitute the resource's actual named rule from [Common Rules](common-rules.md)) |
| Update | Same rule as Create |
| Delete | Superuser only, via Django admin — never an API route |

A resource file only needs its own CRUD table/section when it **deviates** from this — otherwise
a one-line reference to this pattern suffices (e.g. "follows the default resource CRUD pattern;
no deviations").

## Resource categories

Every resource file in this folder belongs to one of four categories, modeled after
[`resourceConfig.js`](../../../frontend/assets/js/utils/requests/resourceConfig.js)'s resource
list — the category alone predicts most of a file's access shape, so a resource file only needs
to name its category plus its deviations, not re-derive the shape from scratch.

- **Game resources** — paths under `/games/<slug>/...` (Game, Character, Treasure-by-game,
  GameSession, GameItem, GameDocument, and their sub-resources). Full/private endpoints go to
  that game's DM (+ superuser); regular endpoints are readable by anyone and, for mutations,
  writable by players of that game too — the exact player grant is the resource's own deviation
  (e.g. **NpcPlayerEdit**, **CharacterRegularEdit**).
- **Staff resources** — paths under `/staff/...` (User staff-management, Staff Cache). Admin/staff
  only, full access — no player or DM grant of any kind.
- **Account resources** — a user has full access over their own account (read and write their own
  profile/settings), except no user, regardless of role, may write `is_superuser`/`is_staff` on
  themselves (a standing privilege-escalation guard — no endpoint exposes either field as
  self-writable today). Endpoints are unified under `/account/...` (`/account/account.json`,
  `/account/language.json`, plus the `authorization_requests` list/deny/authorize routes).
  The adopted `accounts`-app URL-prefix convention: `users/*` is for auth/session-lifecycle
  actions (pre-login routes, plus `logout` as a session action rather than account data);
  `account/*` is for endpoints that read/write the caller's own account data while
  authenticated; `staff/*` is for staff-only endpoints (e.g. `/staff/test-email.json`). Follow
  this rule when adding new `accounts`-app routes rather than rediscovering it from scratch.
- **Sensitive-information resources** — fields such as raw `email` or an account's real identity.
  Never exposed to `AllowAny`; readable only by the account's own owner, players in a relevant
  shared context (e.g. chat/poll participants seeing a reduced `name`/`avatar_url` view), or
  staff/admin. Public-facing endpoints substitute a derived, non-sensitive value
  (`UserProfile.display_name`, a Gravatar-derived `avatar_url`) instead of the raw field.

## Endpoint/role scope

- **Superuser** reaches every page and endpoint, unconditionally.
- **`dm`** reaches every page/endpoint scoped to the game(s) they DM.
- **`player`** reaches every regular (`GET` + mutation) endpoint scoped to the game(s) they play
  in — never a restricted/full endpoint, unless a resource's own deviation says otherwise.
- Only **`admin`/`staff`** reach `DELETE`-style actions. With one exception (below), no resource
  in this document set exposes a `DELETE` API endpoint — every other deletion is Django-admin-only
  (requiring `is_staff` to log into the admin site at all) — so this rule currently applies at the
  admin-site layer, not through any API route, for every resource except the one noted; a resource
  file only needs to flag it if that ever changes for it too.
  - **Exception:** [GameDocument](game-document.md)'s page-trim `DELETE
    /games/<slug>/documents/<document_id>/pages.json` (and its restricted `.../pages/all.json`
    twin) is `player`/`staff`-reachable, not admin-only — a trim there is a normal part of the
    player-facing page-edit saga (dropping now-excess pages after shrinking a document's content),
    not an admin-only purge. See [GameDocument](game-document.md#document-pages-createupdatetrimbump-version-endpoints)
    for the concrete permission.

## `X-Skip-Cache` rule

Named once, so no resource file needs to restate it per endpoint:

- Any endpoint not open to `AllowAny` always sets `X-Skip-Cache: true` on its response.
- Every staff and account endpoint sets it too, regardless of caller — including staff-account
  edit endpoints — since that data is always per-caller-sensitive even when the caller happens to
  be a superuser.

A resource file only needs to call this out when an endpoint **deviates** — e.g. an `AllowAny`
endpoint that still sets the header because of hidden-state leakage (see
[Character](character.md)'s hidden-detail case).

## Filter-visibility rule

A regular (non-restricted) endpoint never accepts a filter on a `hidden`, `incognito`, or
`private_*` attribute — not even tolerantly/silently ignored-but-still-applied; the param is
simply not wired to that column at all. A restricted endpoint accepts every filter its regular
counterpart accepts, plus filters on the restricted-only attributes. A resource file only needs to
list which filters exist per endpoint; which tier each filter belongs to follows from this rule.

## List/show serializer defaults

Unless a resource file states otherwise:

- A list endpoint returns a smaller field set than the equivalent show/detail endpoint.
- List endpoints are paginated.
- Every accepted filter is optional.
- A regular endpoint's exposed field set is always a subset of the equivalent restricted
  endpoint's — a field is never regular-only.

**List field convention**: a list endpoint returns only `id`, a name/identification field, the
parent-connection field (e.g. `game_slug`, `game_item_id`), a photo URL field (when the resource
has one), and whatever extra "badge" fields that specific resource's cards need (e.g.
`public_slain`/`public_allegiance` for Character). A resource file states only its badge-field
exceptions to this convention, not the whole field list again.

## Default hidden-gated collection pattern

Sub-resources scoped to a `Character` or `Game` (`CharacterItem`/`GameItem`,
`CharacterDocument`/`GameDocument`, `CharacterTreasure`/`GameTreasure`, and similar) follow a
second, distinct shape — a plain, lean collection plus a restricted, fuller sibling:

| Action | Who can | Notes |
|--------|---------|-------|
| Plain `list.json`/`detail.json` | **AllowAny** | Excludes rows where `hidden=true`; response never includes a `hidden` field |
| Restricted `all.json`/`full.json` | The resource's edit-level permission (e.g. `CharacterEdit`/`GameEdit`) | Includes hidden rows; response includes `hidden` |
| Create/Update | The resource's own `*CreatePermission` | — |

As with the default CRUD pattern above, a file only needs to restate this table when it
deviates. Resource-specific extras — fallback-to-parent field resolution, `available.json`/
`acquire.json`/`remove.json`-style extra actions, NPC-only hidden-visibility gates — are
deviations worth documenting per file; only the restated plain/all/full permission shape itself
is safe to collapse to a one-line reference.

## Field-naming conventions

Recurring field names carry the same access rule wherever they appear, so a resource file states
only the field's *presence*, not a re-derivation of what the name itself already implies:

### Public vs regular attribute pattern

When an attribute has a restricted "real" value and a wider-audience "public" value, the model
carries **two fields**: `x` (the real value) and `public_x` (the public value).

- The partial/limited endpoint exposes `public_x` under the plain `x` JSON key, so the frontend
  always reads one key (`x`) regardless of which endpoint served the payload.
- The full endpoint exposes both keys separately: `x` (real) and `public_x` (public).
- Filtering on the partial endpoint filters against the `public_x` column; filtering on the full
  endpoint filters against the real `x` column — each endpoint filters on the same field it
  exposes under the shared key, so a query param never lets an unauthorized caller filter on data
  it cannot otherwise read.

Exposed, for both read and write, only on the resource's full/edit-level route; never on the
partial/public route. See `private_allegiance`/`public_allegiance` and
`private_slain`/`public_slain` on [Character](character.md) for a concrete example.

This is not the same thing as a plain **hidden attribute** (e.g. `description` vs
`hidden_description`, or a boolean `hidden` field below). A hidden attribute is simply absent
from responses for audiences who lack access — there is no alternate public value substituted in
its place, unlike `x`/`public_x` above where every audience gets a value, just not always the
real one.

### `id` / `<related>_id`

Always safe to expose to anyone, regardless of endpoint — never accepted in a create/update
request payload (always server-assigned). Resource files no longer need to state this per
endpoint.

### `hidden`

A restricted-only field exposure plus row filter, exactly per the [Default hidden-gated
collection pattern](#default-hidden-gated-collection-pattern) above.

### `incognito`

Same restricted-visibility treatment as `hidden`, but `Character`-specific, and **cascades**: an
incognito (or hidden) NPC also gates its own nested sub-resources (documents, items, photos), not
just its own fields — the cascade is stated once here; per-file mentions are a one-line pointer
back to this section instead of a re-derivation. See [Character](character.md#incognito)
for the concrete field-level effects.
