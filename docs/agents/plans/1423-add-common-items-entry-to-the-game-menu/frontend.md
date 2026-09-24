# Frontend Plan: Add "Common Items" entry to the Game menu

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the i18n key `game_page.common_items` (en `Common Items`, pt `Itens Comuns`),
  which the translator adds. Do not add the YAML entries yourself.

## Implementation Steps

### Step 1 — Register the Game menu entry

In `NAV_LINK_REGISTRY` (`HeaderNavHelper.jsx`), add, immediately after
`gameItem('items', '/items', 'game_page.items')`:

```js
gameItem('common-items', '/common_items', 'game_page.common_items'),
```

Keep the default rule (`IS_GAME_PAGE`), the same as Items and Possessions. Common items
have the same permissions as `GameItem`: the list endpoint is public, with hidden entries
filtered out, and the page itself already handles hidden entries and the create button.
Update the `gameItem` JSDoc's list of base items
(`show/pcs/npcs/treasures/items/possessions/factions/documents/photos`) to include
`common-items`.

The dropdown renders in `NAV_LINK_REGISTRY` order within the `game` group, so placement
in the array determines the visual position.

### Step 2 — Update the Game menu order spec

In `gameNavLinksSpec.js`, update the test
`renders items in Show/PCs/NPCs/Treasures/Items/Possessions/…/Photos order`:
- Insert `'#/games/epic-quest/common_items"'` between `'#/games/epic-quest/items"'` and
  `'#/games/epic-quest/possessions"'` in the `hrefs` array.
- Add `Common Items` after `Items` in the test title.

Check for any other spec that asserts the exact count or ids of the `game` group's
`NAV_LINK_REGISTRY` entries (e.g. an id-uniqueness or count spec), and update it if needed.

## Files to Change

- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`: new
  `gameItem` entry after `items`, plus the JSDoc list update.
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/gameNavLinksSpec.js`:
  expected href order and test title.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- This change has no backend, route, or permission component. The route
  (`HashRouteResolver.js`: `['/games/:game_slug/common_items', 'gameCommonItems']`)
  and the page (`GameCommonItems.jsx`) already exist.
- The label renders as the raw key until the translator's change lands. Both changes ship
  in the same PR.
