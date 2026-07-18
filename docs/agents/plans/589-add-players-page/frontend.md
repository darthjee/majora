# Frontend Plan: Add players page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `GET /games/:game_slug/players.json` exactly as specified in
[plan.md](plan.md)'s "Shared contracts" section. Depends on the translator agent adding
`game_page.players` and `game_players_page.loading` (see [translator.md](translator.md)).

## Implementation Steps

### Step 1 — Add the nav link

In `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`, add a
`NavDropdown.Item` for Players inside `renderGameNavLinks`, alongside the existing PCs/NPCs/
Treasures/Items entries:

```jsx
<NavDropdown.Item href={`#/games/${gameSlug}/players`}>{Translator.t('game_page.players')}</NavDropdown.Item>
```

Per the issue, this link (and the page/endpoint) is limited to DM/player/staff/superuser —
reuse `#renderGameAccessNavItems`'s existing `state.gameAccess` check (`is_dm || is_player
|| is_superuser || is_staff`) rather than adding a second, differently-scoped check: either
extend that private method to also return the Players item, or inline the same condition
for this one item. Prefer extending `#renderGameAccessNavItems` since the audience is
identical to the Polls/Sessions links it already gates.

### Step 2 — Register the route

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: register
  `this.#router.register('/games/:game_slug/players', 'gamePlayers');` alongside the other
  `games/:game_slug/*` registrations.
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import `GamePlayers` and add
  `gamePlayers: <GamePlayers />` to the `PAGES` map.

### Step 3 — Add the page component and helper

Following `GamePcs.jsx`/`GamePcsHelper.jsx` exactly:

- `frontend/assets/js/components/resources/character/pages/GamePlayers.jsx` (or a new
  `resources/player/pages/` folder if the project's resource-folder convention favors a
  dedicated resource per entity — check how `game_session`/`item` got their own top-level
  `resources/` folder vs. reusing `character/`; `Player` is closer to its own resource than
  a character sub-type, so prefer a new `resources/player/pages/GamePlayers.jsx`) —
  extracts `game_slug` via `BasePageController.extractParam` and delegates to
  `GamePlayersHelper.render(gameSlug)`.
- `frontend/assets/js/components/resources/player/pages/helpers/GamePlayersHelper.jsx` —
  renders `PageActions` (back button) + `<h1>Players</h1>` + `<ListPage type="players"
  gameSlug={gameSlug} basePath={...} loadingMessage={Translator.t('game_players_page.loading')}
  />`, matching `GamePcsHelper`'s shape (no "New" affordance — read-only page, same as PCs).

### Step 4 — Add the `PlayerListItem` wrapper

`frontend/assets/js/components/common/list_types/PlayerListItem.js`, extending
`BaseListItem`:

```js
import BaseListItem from './BaseListItem.js';

export default class PlayerListItem extends BaseListItem {
  get photoUrl() {
    return this.data.character?.photo_url ?? null;
  }

  get displayText() {
    return this.data.character?.name ?? '';
  }
}
```

`photoUrl` returning `null` for a DM/characterless player lets `CardAvatar` (via
`photoType: 'avatar'`) fall back to the existing character placeholder image automatically
— no new placeholder logic needed.

### Step 5 — Add the user-avatar badge component

No existing component renders a circular photo with a hover tooltip (`Badge`/`TooltipBadge`
are icon/pill-shaped). Add
`frontend/assets/js/components/common/badges/UserAvatarBadge.jsx`, following
`TooltipBadge.jsx`'s exact `OverlayTrigger`/`Tooltip` structure but rendering a small
circular `<img>` instead of `Badge`:

```jsx
import React from 'react';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';

export default function UserAvatarBadge({ photoUrl, displayName }) {
  return (
    <OverlayTrigger placement="bottom" overlay={<Tooltip>{displayName}</Tooltip>}>
      <img src={photoUrl} alt={displayName} className="user-avatar-badge rounded-circle" />
    </OverlayTrigger>
  );
}
```

Add a `.user-avatar-badge` CSS rule (small fixed size, e.g. `24px`/`24px`, `object-fit:
cover`) — there is no existing circular-avatar class to reuse (per the earlier codebase
investigation, `rounded-circle` alone with no fixed size would stretch to the image's
natural dimensions).

### Step 6 — Wire the badge into the info bar

In `frontend/assets/js/components/common/list_types/configs/` add a `playersListType.js`
(new file, alongside `gamesListType.js`, `characterListTypes.js`):

```js
import GenericClient from '../../../../client/GenericClient.js';
import PlayerListItem from '../PlayerListItem.js';
import UserAvatarBadge from '../../badges/UserAvatarBadge.jsx';
import React from 'react';

function fetchPlayers(gameSlug, hashResolver, client = new GenericClient()) {
  return client.fetchIndex(`/games/${gameSlug}/players.json`).then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
}

function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

function buildPlayerInfoBarItems(item) {
  const { user } = item.data;
  if (!user) {
    return [];
  }
  return [{
    key: 'user-badge',
    label: React.createElement(UserAvatarBadge, {
      photoUrl: user.photo_url,
      displayName: user.display_name,
    }),
  }];
}

function buildPlayerItemHref() {
  return null; // Players have no standalone detail page in scope for this issue.
}

const playersListType = {
  fetchList: fetchPlayers,
  wrapperClass: PlayerListItem,
  filtersComponent: null,
  photoType: 'avatar',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildPlayerInfoBarItems,
  showCaption: true,
  buildItemHref: buildPlayerItemHref,
};

export default playersListType;
```

Register it in `listTypeConfig.js`: `players: playersListType,` (import + spread/assign
alongside the existing `games`/`pcs`/`npcs` entries).

This reuses the exact same `InfoBar` overlay mechanism `InfoBarRules`/`TooltipBadge`
already use for the per-character status badges — `ActionsOverlay` renders whatever
`buildInfoBarItems` returns inside the always-visible top bar over the photo, so the new
user-avatar badge appears in the same visual position as those existing badges, per the
issue's "in the info bar" wording and the user's confirmed "per-item overlay" placement
choice.

### Step 7 — No-cache

Add `/players.json` to
`frontend/assets/js/client/config/skipCacheSuffixes.js`'s suffix set, with a comment
mirroring the existing `/messages.json` rationale (authorization-gated, per-viewer data —
`user`/`character` differ per requester's own game membership, so a cached response must
never be served to another client). The backend already sets `X-Skip-Cache: true` on the
response independently (see [backend.md](backend.md) Step 4) — this frontend addition
covers the request-side header for any caching layer that keys off it, matching the
existing convention for other per-viewer endpoints.

## Files to Change

- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — add the
  Players nav link.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — register the route.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — add to `PAGES`.
- `frontend/assets/js/components/resources/player/pages/GamePlayers.jsx` — new.
- `frontend/assets/js/components/resources/player/pages/helpers/GamePlayersHelper.jsx` —
  new.
- `frontend/assets/js/components/common/list_types/PlayerListItem.js` — new.
- `frontend/assets/js/components/common/badges/UserAvatarBadge.jsx` — new.
- `frontend/assets/js/components/common/list_types/configs/playersListType.js` — new.
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — register `players`.
- `frontend/assets/js/client/config/skipCacheSuffixes.js` — add `/players.json`.
- `frontend/assets/css/*` — new `.user-avatar-badge` rule (exact file: whichever stylesheet
  already holds `.info-overlay`/`.card-photo-square`, to keep related rules together).
- `frontend/specs/.../HeaderNavHelper.spec.js`, `.../PlayerListItem.spec.js`,
  `.../UserAvatarBadge.spec.jsx`, `.../playersListType.spec.js`,
  `.../GamePlayersHelper.spec.jsx` — new/updated specs mirroring the assets tree, per
  `AGENTS.md`'s "specs mirror `assets/js/`" convention.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)

## Notes

- Whether `GamePlayers.jsx` lives under `resources/player/` (new folder) or
  `resources/character/` is a judgment call left to the implementing agent — pick whichever
  keeps the resource-folder convention most consistent with how `item`/`game_session` were
  each given their own top-level `resources/` folder; either choice is functionally
  equivalent to `ListPage`/routing.
- `buildPlayerItemHref` returns `null` since no standalone Player detail page exists — same
  pattern already used by `items`' `buildNullItemHref` in `listTypeConfig.js`.
