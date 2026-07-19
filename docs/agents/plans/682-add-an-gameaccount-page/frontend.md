# Frontend Plan: Add a My Games page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `GET /my-games.json` exactly as specified in [plan.md](plan.md)'s "Shared contracts"
section. Assumes the i18n keys listed there (`header.nav_my_games`, `my_games.role_dm`,
`my_games.role_player`, `my_games.following_tooltip`, `my_games.unread_tooltip`) exist — the
`translator` agent adds them independently; no need to wait on that agent, just use the key names.

## Implementation Steps

### Step 1 — List type config

Add `frontend/assets/js/components/common/list_types/configs/myGamesListType.js`, modeled closely
on `gamesListType.js`:

- `fetchList: (gameSlug, hashResolver, client) => client.fetchIndex('/my-games.json')`
- `wrapperClass: MyGameListItem` (Step 2)
- `buildItemHref: (item) => \`#/games/${item.data.game.game_slug}\``
- `buildInfoBarItems: (item) => [...]` — up to 4 `{key, label}` entries (role, character, following
  count, unread count), built via a new helper (Step 3). Reuse `gamesListType.js`'s other fields
  (`photoType`, `showCaption`, etc.) unchanged.

Register the new type in the list-type config registry the same way `games` is registered (check
`listTypeConfig.js`'s aggregation point).

### Step 2 — List item wrapper

Add `frontend/assets/js/components/common/list_types/MyGameListItem.js`, extending `BaseListItem`
(or `GameListItem`, whichever composes cleaner) but reading from the nested `game` object instead
of a flat payload: `displayText` → `this.data.game.name`, `photoUrl` → `this.data.game.cover_photo_path
?? null`. Keep `role`, `character`, `conversations` accessible via `this.data.*` for the info-bar
builder.

### Step 3 — Info-bar badges

New helper (e.g. `frontend/assets/js/components/common/list_types/helpers/MyGamesInfoBarRules.js`,
mirroring the shape of `InfoBarRules.js`) building 4 items from `item.data`:

- Role badge: plain `Badge` (`common/badges/Badge.jsx`) with text
  `Translator.t(role === 'dm' ? 'my_games.role_dm' : 'my_games.role_player')`.
- Character badge: `Badge` with `character.name`, omitted entirely when `character` is `null`.
- Following-count badge: new small component (e.g. `ConversationCountBadge.jsx`) —
  `OverlayTrigger`/`Tooltip` wrapping a `Badge` with `icon={Icons.envelope}` (add a new
  `envelope: 'bi-envelope'` constant to `Icons.js` — the existing `envelope` key is already
  `bi-envelope-fill`, so rename/repurpose carefully to keep the unread header indicator that uses
  it today unaffected) and `text={conversations.count}`. Tooltip text:
  `Translator.t('my_games.following_tooltip').replace('{{count}}', conversations.count)`.
- Unread-count badge: same component, `icon={Icons.envelopeFill}` (the current `bi-envelope-fill`
  constant), `text={conversations.unread_count}`, tooltip via
  `Translator.t('my_games.unread_tooltip').replace('{{count}}', conversations.unread_count)`.
  Omit this badge when `unread_count` is `0`? Not specified by the issue — default to always
  showing it (consistent with the following-count badge always showing), flag as open question.

### Step 4 — Page + routing + header link

- `frontend/assets/js/components/resources/game/pages/MyGames.jsx` +
  `MyGamesHelper.jsx`, modeled on `Games.jsx`/`GamesHelper.jsx`: `<ListPage type="my-games"
  basePath="#/games" .../>` (basePath still points at `#/games/<slug>` for card links, per Step 1's
  `buildItemHref`).
- Register in the page registry (wherever `Games.jsx`/`MyAccount.jsx` are mapped — check
  `AppHelper.jsx`'s `PAGES`) and in `frontend/assets/js/utils/routing/HashRouteResolver.js`'s
  `ROUTES` array: `['/my-games', 'myGames']`.
- Add a `NavDropdown.Item href="#/my-games" data-testid="my-games-link">
  {Translator.t('header.nav_my_games')}</NavDropdown.Item>` to
  `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`, next to the existing
  `#/my_account` item (same dropdown, same auth gating — already inside the `state.loggedIn`
  branch).

### Step 5 — Tests

- `frontend/specs/assets/js/components/common/list_types/listTypeConfig/myGamesSpec.js`, modeled on
  `playersSpec.js` — asserts `fetchList`, `wrapperClass`, `buildItemHref`, `buildInfoBarItems`
  (role/character/counts, including the character-omitted-when-null and DM cases).
- `frontend/specs/assets/js/components/common/list_types/MyGameListItemSpec.js`, modeled on
  `GameListItemSpec.js`/`PlayerListItemSpec.js` — asserts `photoUrl`/`displayText` read from the
  nested `game` object.
- A header spec covering the new "My Games" dropdown link renders only when logged in (check
  existing `HeaderHelper` spec for the `#/my_account` link's equivalent test to mirror).

## Files to Change

- `frontend/assets/js/components/common/list_types/configs/myGamesListType.js` — new.
- `frontend/assets/js/components/common/list_types/MyGameListItem.js` — new.
- `frontend/assets/js/components/common/list_types/helpers/MyGamesInfoBarRules.js` — new.
- `frontend/assets/js/components/common/badges/ConversationCountBadge.jsx` — new.
- `frontend/assets/js/utils/ui/Icons.js` — add/adjust envelope icon constants.
- `frontend/assets/js/components/resources/game/pages/MyGames.jsx` — new.
- `frontend/assets/js/components/resources/game/pages/elements/helpers/MyGamesHelper.jsx` — new
  (path mirrors `GamesHelper.jsx`'s actual location — confirm exact folder during implementation).
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — add dropdown link.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add `/my-games` route.
- Page registry file (wherever `PAGES`/route-to-component mapping lives, e.g. `AppHelper.jsx`) —
  register `MyGames`.
- New spec files listed in Step 5.

## CI Checks

- `frontend`: `yarn test` (CI job: `jasmine`)
- `frontend`: `yarn lint` (CI job: `frontend-checks`)

## Notes

- Confirm the exact `Icons.js` handling before changing `envelope`'s existing value — it's reused
  today by the header's unread indicator; repurposing it without checking call sites would be a
  regression, not part of this issue's scope.
- Whether the unread-count badge should hide itself at `0` is unspecified by the issue; default to
  always visible unless the user flags otherwise during implementation review.
