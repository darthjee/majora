# Frontend Plan: Add Player page

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — this page consumes
`GET /games/:game_slug/players/:id.json` (single `PlayerListSerializer`-shaped object) and
`GET /games/:game_slug/conversations.json?player_id=<id>` (paginated `{id, title}` list), both
backend-produced. No dropdown-menu change is needed — `HeaderNavHelper.jsx:106` already links
to `/#/games/:game_slug/players`.

## Implementation Steps

### Step 1 — Route registration

- `assets/js/utils/routing/HashRouteResolver.js` — add
  `['/games/:game_slug/players/:id', 'gamePlayer']` to `ROUTES`, right after the existing
  `['/games/:game_slug/players', 'gamePlayers']` entry. Segment count (4 vs. 3) means no
  ambiguity with the list route.
- `assets/js/components/helpers/AppHelper.jsx` — import a new `GamePlayer` page component and
  add `gamePlayer: <GamePlayer />,` to `PAGES`, next to the existing `gamePlayers` entry.

### Step 2 — Make roster cards clickable

`assets/js/components/common/list_types/configs/playersListType.js` — `buildPlayerItemHref`
currently always returns `null` (with a comment saying players have no detail page "in scope for
this issue" — that issue is this one). Change it to:
```js
function buildPlayerItemHref(item, gameSlug) {
  return `#/games/${gameSlug}/players/${item.data.id}`;
}
```
(match the exact signature `ListPageHelper` calls `buildItemHref` with — verify against another
`buildItemHref` implementation, e.g. treasures/characters list types, for the exact `(item,
gameSlug, ...)` argument order already in use).

### Step 3 — `PlayerClient`

New `frontend/assets/js/client/PlayerClient.js` extending `BaseClient` (same shape as
`GameSessionClient`/`GameTaskClient`):
```js
export default class PlayerClient extends BaseClient {
  fetchPlayer(gameSlug, id, token) {
    return this.getJson(`/games/${gameSlug}/players/${id}.json`, token);
  }

  fetchConversations(gameSlug, playerId, token, params = new URLSearchParams()) {
    const query = new URLSearchParams(params);
    query.set('player_id', playerId);
    return this.getJson(`/games/${gameSlug}/conversations.json?${query.toString()}`, token);
  }
}
```
`params` carries pagination (`page`/`per_page`), mirroring `GameTaskClient`'s query-param
pattern found during research.

### Step 4 — `PlayerController`

New `frontend/assets/js/components/resources/player/pages/controllers/PlayerController.js`,
structured like `CharacterController`/`PcCharacterController` but simpler (no PC/NPC kind
parameter, no treasures/items/photos merge):
- Constructor takes `(setPlayer, setLoading, setError, client, paramsFromHash, playerClient)`.
- Static `getPlayerParamsFromHash(hash)` using `BasePageController.extractParams`, mirroring
  `PcCharacterController.getPcCharacterParamsFromHash`, pattern
  `/games/:game_slug/players/:id`, params `['game_slug', 'id']`.
- `buildEffect()` — reads params from the current hash, calls
  `playerClient.fetchPlayer(gameSlug, id, token)`, `setPlayer`/`setError`/`setLoading(false)` on
  settle — same shape as `CharacterController`'s effect, without the extra
  treasures/items/photos fan-out `CharacterListsController` adds (not needed here).
- A separate method (or a second small controller/hook) for conversations pagination: fetches
  `playerClient.fetchConversations(gameSlug, id, token, {page})` and exposes
  `{conversations, pagination, loading, error}` state, since it's paginated independently of the
  player fetch itself.

### Step 5 — `GamePlayer` page + `PlayerHelper`

New `frontend/assets/js/components/resources/player/pages/GamePlayer.jsx` (thin wrapper, mirrors
`PcCharacter.jsx`) using a new `PlayerDetail` shared component (mirrors `CharacterDetail.jsx`'s
loading/error/effect/back-link plumbing, without the PC/NPC photo-upload/money-modal extras
which don't apply to players).

New `frontend/assets/js/components/resources/player/pages/helpers/PlayerHelper.jsx` — renders:
- Two compact, list-style cards side by side at the top: character (photo + name, from
  `player.character`) and player (photo + display name, from `player.user`), reusing the same
  accessor style as `PlayerListItem`/`BaseListItem` (`data.character?.photo_url`,
  `data.character?.name`, `data.user?.photo_url`, `data.user?.display_name`) but rendered as two
  standalone cards rather than through `ListPageHelper`'s grid (which is grid/`ActionsOverlay`-
  coupled and not reusable here per the research above). Render `null`/placeholder for a `null`
  `character` (DM) or `null` `user` (no linked account), same nullability the roster list
  already handles.
- A left column with the conversations list (title + link, once conversation detail is scoped
  in a later issue — for now, plain text or a disabled-looking row, since clicking through isn't
  in scope) and the shared `Pagination` component (`assets/js/components/common/pagination/
  Pagination.jsx`), using a distinct `pageParam` (e.g. `'conv_page'`) so it doesn't collide with
  any page-level pagination on this route, `basePath` = the current player detail hash.
- An empty right column placeholder (a comment noting it's reserved for the future messages
  feature, per the issue).
- `renderLoading()`/`renderError(error)` following `CharacterHelper`'s pattern.

### Step 6 — i18n

`frontend/assets/i18n/en.yaml` and `pt.yaml` — add a new `player_page:` block (alongside the
existing `game_players_page:`/`character_page:` blocks) with at least a `loading` key and
whatever labels the two cards / conversations column need. Both files must be updated together;
`npm run check_i18n` (part of the `frontend-checks` CI job) enforces key parity.

### Step 7 — Specs

Mirror source paths under `frontend/specs/assets/js/...` with the `Spec.js` suffix convention
already used (e.g. `GamePlayersSpec.js`, not `.spec.jsx`):
- `frontend/specs/assets/js/components/resources/player/pages/GamePlayerSpec.js`
- `frontend/specs/assets/js/components/resources/player/pages/helpers/PlayerHelperSpec.js`
- `frontend/specs/assets/js/components/resources/player/pages/controllers/PlayerControllerSpec.js`
- `frontend/specs/assets/js/client/PlayerClientSpec.js`
- Update `frontend/specs/.../list_types/configs/playersListTypeSpec.js` (or wherever
  `buildPlayerItemHref` is currently tested returning `null`) for the new href behavior.
- Update `HashRouteResolverSpec.js`/`AppHelperSpec.js` if they enumerate all routes/pages.

## Files to Change

- `assets/js/utils/routing/HashRouteResolver.js`
- `assets/js/components/helpers/AppHelper.jsx`
- `assets/js/components/common/list_types/configs/playersListType.js`
- `assets/js/client/PlayerClient.js` (new)
- `assets/js/components/resources/player/pages/GamePlayer.jsx` (new)
- `assets/js/components/resources/player/pages/shared/PlayerDetail.jsx` (new)
- `assets/js/components/resources/player/pages/helpers/PlayerHelper.jsx` (new)
- `assets/js/components/resources/player/pages/controllers/PlayerController.js` (new)
- `assets/i18n/en.yaml`, `assets/i18n/pt.yaml`
- Corresponding spec files listed in Step 7

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs all Jasmine specs + coverage.
- `frontend`: `npm run check_i18n && npm run lint` (CI job: `frontend-checks`).

## Notes

- `ListPage`/`ListPageHelper` are grid-and-`ActionsOverlay`-coupled (confirmed via research) —
  do not try to reuse them for either the two top cards or the conversations column; build
  lighter dedicated components instead, reusing only `Pagination` and the `BaseListItem`-style
  field accessors for consistency.
- The right-hand column is intentionally inert in this issue (messages land in a follow-up
  issue per the refined issue text) — keep it a simple placeholder, not a stubbed-out
  component with props for a feature that doesn't exist yet.
- Conversation rows are not yet clickable (no conversation detail page exists) — render them as
  plain text/list items, not links, until that's in scope.
