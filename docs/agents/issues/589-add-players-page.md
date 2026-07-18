# Issue: Add players page

## Description

Add a "Players" page for each game, listing the game's roster (its DM and players). A new
"Players" link is added to the `Game` dropdown menu on pages under `/#/games/:game_slug/...`,
taking the user to a new page at `/#/games/:game_slug/players`.

## Problem

There is currently no way to see, at a glance, who is participating in a game — its DM and
players, and which character each player is playing. `Player` records already exist in the
data model (they back DM status and character ownership), but per
`docs/agents/access-control/player.md` they have no dedicated public endpoint today and are
not exposed in any list or detail endpoint.

Separately, nothing in the current model prevents a `Player` from owning more than one PC —
`Character.player` is a plain nullable FK with no uniqueness constraint. The product
definition (`docs/agents/product.md`) currently documents "a Player owns zero or more
characters," which this issue intentionally narrows to "zero or one."

## Expected Behavior

- A "Players" entry appears in the `Game` dropdown menu, alongside the existing entries
  (PCs, NPCs, etc.), for any DM, player, or staff/superuser of that game — same visibility
  rule already used for the Polls/Sessions links
  (`HeaderNavHelper#renderGameAccessNavItems`).
- Clicking it navigates to `/#/games/:game_slug/players`.
- The page shows one item per `Player` in the game, using the same list-page layout already
  used for Games/PCs (`ListPage` + a per-type config in `listTypeConfig`):
  - Photo: the player's character photo, or the character placeholder image when the player
    has no character (e.g. the DM, or a player who owns no PC yet).
  - Name: the player's character name (or a placeholder state when there is no character).
- Each item additionally shows a small circular badge with the underlying `User`'s avatar;
  hovering it shows a tooltip with the user's display name. A `Player` with no linked `User`
  (a named participant with no login account) shows no badge, since there is no display name
  or photo to show.
- No filters are available on this page for now.
- Attempting to add a second PC to a `Player` who already owns one is rejected at the data
  layer (new DB constraint), on top of any existing application-level checks.

## Solution

### Endpoint

`GET /games/:game_slug/players.json` returns the paginated list of `Player` records for the
game, following the same `paginated_list_response` shape used by `pcs.json`/`games.json`.

Payload per item:

```json
{
  "id": 1,
  "user": {
    "display_name": "...",
    "photo_url": "..."
  },
  "character": {
    "name": "...",
    "photo_url": "..."
  }
}
```

- `user` is `null` when the `Player` has no linked `User` account (a named participant with no
  login identity, per `Player.user`'s nullability). Otherwise, `user.photo_url` is the
  Gravatar URL built the same way as `MyAccountDetailSerializer.get_avatar_url` /
  `SessionMessageUserSerializer.get_avatar_url` (`UserProfile.objects.get_or_create(user=user)`
  + `GravatarUrlBuilder.build`).
- `character` is the player's first (only, once the new constraint lands) owned PC; for a DM,
  or a player who owns no PC yet, `character` is `null` and the frontend renders the
  character placeholder image in its place.
- Response sets `X-Skip-Cache: true` (matching the `/all.json`/`/full.json`/`/messages.json`
  convention in `docs/agents/access-control/character.md` and
  `frontend/assets/js/client/config/skipCacheSuffixes.js`), since this is authorization-gated,
  per-viewer data.

### Permissions

Page, nav link, and endpoint are available to: superuser, any DM or player of the game (i.e.
any `Player` row for the game linked to the requesting user), and staff — the same
`user.is_superuser or user.is_staff or game.players.filter(user=user).exists()` rule already
used by `PollPermission`/`SessionMessagePermission`/`PollVotePermission`
(`backend/games/permissions.py`).

### Frontend

Reuses the existing list-page machinery rather than building something new:

- A new page component (`GamePlayers.jsx` + `GamePlayersHelper.jsx`), registered in
  `HashRouteResolver.js` and `AppHelper.jsx`'s `PAGES` map, following the exact shape of
  `GamePcs.jsx`/`GamePcsHelper.jsx`.
- A new `playersListType.js` config (alongside `gamesListType.js`,
  `characterListTypes.js`), wired into `listTypeConfig`.
- A new `PlayerListItem` wrapper extending `BaseListItem`
  (`frontend/assets/js/components/common/list_types/BaseListItem.js`), following
  `GameListItem`/`PcListItem`:
  - `photoUrl` → `data.character?.photo_url ?? null` (falls back to the character
    placeholder when null, same as existing PC/NPC handling of a missing photo).
  - `displayText` → `data.character?.name ?? null`.
  - Also exposes `data.user` so the item renderer can show the new circular user-avatar
    badge with a tooltip (`data.user.display_name`, `data.user.photo_url`); the badge is
    omitted entirely when `data.user` is `null`.
- The circular avatar-with-tooltip badge is new UI — no existing component matches this shape
  today (`Badge`/`TooltipBadge` are icon/pill-shaped; the existing `InfoBar` overlay is
  icon-only). It will be a small new component, likely following the same
  `OverlayTrigger`/`Tooltip` approach `TooltipBadge` already uses, rendered as a per-item
  overlay on the player's card (the same "info bar" position used for the existing
  per-character-card `InfoBar`), rather than a page-level or header element.

### Data constraint

Add a uniqueness constraint so a `Character.player` (once set, i.e. non-null) can be linked to
at most one `Character` — enforced at the DB level via a partial unique constraint (e.g.
`UniqueConstraint(fields=['player'], condition=Q(player__isnull=False), ...)`), mirroring how
`Player` itself already enforces `unique_together = [('game', 'user')]`. NPCs and PCs with no
player keep `player=None` and are unaffected. This is scoped to production data already being
consistent with the new rule (per the issue), so no backfill/cleanup migration is included —
only the constraint itself.

### Documentation

`docs/agents/access-control/player.md` currently states Players have no public endpoint;
update it alongside this change. `docs/agents/product.md`'s "Player" section (currently "a
Player owns zero or more characters") also needs updating to "zero or one."

## Benefits

- Gives DMs and players a quick roster view of who's playing what in a game.
- Formalizes the "one character per player" rule at the database level instead of leaving it
  as an unenforced assumption.
- Reuses existing list-page, permission, and no-cache conventions instead of introducing new
  ones, keeping the codebase consistent.
