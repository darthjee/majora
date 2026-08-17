# Issue: Add common special items

## Description
Right now the system models several different kinds of belongings:
- **Treasure**: itens with monetary value, tradeable for coins — characters
  hold several copies of each.
- **GameItem**/**CharacterItem**: magic or extraordinary unique itens — a
  `Character` may hold its own `CharacterItem` instance of a `GameItem`, with
  its own description.
- **Document**: a document the character has access to, owned singly (not a
  copy).
- **Possession**: big unique belongings (houses, boats, etc.), also owned
  singly.

None of these fit a curated, shop-style list of common items with a price
tag — potions, drugs, and similar mundane items of interest. This issue adds
a new entity, **`GameCommonItem`**, for exactly that: a game-level catalog
(no character-owned copies) with a name, price, description, photo, and
visibility flag, so players can check prices without having to ask the DM.

## Problem
We don't want to track mundane itens like arrows, food, or potions the way
`Treasure`/`GameItem` do — no character-owned copy should exist for them,
just a game-level entry. At the same time, players want a proper, priced
list of common itens of interest (different types of potion, drug, or
anything similar) so they don't need to ask the DM to check prices all the
time. Neither `Treasure` (character-quantity-tracked), `GameItem`/
`CharacterItem` (unique/magic, optionally character-owned), nor `Document`/
`Possession` (single character ownership) is the right shape for this.

## Expected Behavior
- A game has its own `GameCommonItem` catalog: `name`, `price`, `description`,
  `photo`, `hidden`, `category`.
- No character ever owns a `GameCommonItem` — it is purely a game-level
  reference list (unlike `Treasure`/`GameItem`/`Document`/`Possession`, which
  all have some notion of character ownership).
- Non-hidden entries are visible to any reader; hidden entries are visible
  only to DM/staff, via a restricted endpoint variant.
- dm/admin can do it all; players and staff can create/edit and upload a
  photo; everyone else can only read.
- Pages (`entity_type` = `common_items`):
  - `/#/games/:game_slug/common_items/new`
  - `/#/games/:game_slug/common_items`
  - `/#/games/:game_slug/common_items/:id`
  - `/#/games/:game_slug/common_items/edit`

## Solution

### Entity naming
The natural name "GameItem" is already taken by the existing magic/unique
item concept, so two options were considered:
- rename `GameItem`/`CharacterItem` to `GameSpecialItem`/`CharacterSpecialItem`,
  freeing up "Item" for the new concept — rejected: touches every layer of an
  already-in-production feature (models/migrations, serializers, views, urls,
  permissions config, frontend routes/components, i18n, tests) purely to free
  up a name, with real risk of missing a reference along the way. The internal
  name isn't even user-facing beyond the URL slug, since display text goes
  through i18n either way.
- add a new, fully additive concept alongside the untouched existing
  entities — **chosen**, lowest risk.

New entity is named **`GameCommonItem`** (game-only, no character version).
`GameItem`/`CharacterItem` stay completely unchanged.

### New entity properties
- `photo` (single photo, like `Treasure`)
- `name`
- `price`
- `description`
- `hidden`
- `category`

### Edge cases
- **Duplicate names**: no uniqueness constraint on `name`, following the same
  pattern as `GameItem`/`GamePossession`/`Treasure` (none of which enforce
  name-uniqueness either).
- **Price format**: plain `IntegerField`, same convention as `Treasure.value`
  (implicit single currency, no separate currency/unit field). For display,
  reuse the existing `TreasureMoney`/`TreasureMoneyHelper` +
  `MoneyModelRegistry` strategy (game-type-aware: denomination breakdown for
  D&D, `$dollars,cents` for Deadlands) rather than building new formatting
  logic.
- **Category**: fixed hardcoded list via a `category` choice field, following
  the same class-constants-+-`CHOICES` convention as `Game.GAME_TYPE_CHOICES`.
  Final list: `potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`,
  `other`. `weapon`/`armor` were considered but dropped — mundane or magic
  weapons/armor stay modeled by the existing `GameItem` entity, so they're
  out of scope for `GameCommonItem` to avoid overlap.
- **Category scope across game types**: a single universal `category` list
  applies regardless of the owning game's `game_type` (`dnd`, `deadlands`,
  ...) — an item that doesn't cleanly fit any category in a given setting
  uses `other`. No existing field in the codebase varies its choices by
  `game_type`, and `Treasure.value` itself is game-type-agnostic (only its
  *display* formatting varies via `TreasureMoneyHelper`), so this stays
  consistent with that precedent.

### Permissions
Same shape as `GamePossession` (closest analog: game-only, single photo,
`hidden` flag) — dm/admin get an implicit shortcut, players and staff can
create/edit/upload photo, others read-only:

**Backend** — two GET endpoint pairs (regular filters `hidden=False` and is
public/`AllowAny`; the `_all`/`_full` restricted variant is DM/staff-only via
`check_game_edit` and sets `X-Skip-Cache: true`):
- `game_common_items` (collection, public) / `game_common_items_all`
  (collection, restricted)
- `game_common_item_detail` (single, public GET + PATCH edit) /
  `game_common_item_detail_full` (single, restricted)
- `permissions/config/game_common_item/endpoints.yml`: `create`,
  `photo_upload`, `edit` → `staff` + `player`.

**Frontend** — `RequestPermissionResolvers.js` gets a `gameCommonItem` entry.
Unlike `item`/`possession`/`document` (which all branch on
`kind: 'game'|'pcs'|'npcs'` because they have a character-owned variant),
`GameCommonItem` has none, so it's unconditionally game-level for both keys:
```js
gameCommonItem: {
  collection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
  single: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
},
```

## Benefits
- Players get an authoritative, priced common-item list without needing to
  interrupt the DM.
- Fully additive: zero risk to the existing `GameItem`/`CharacterItem`
  magic-item feature or any other existing entity.
- Reuses established patterns — `GamePossession`-shaped permissions,
  `Treasure`-shaped price storage/display, `Game.GAME_TYPE_CHOICES`-shaped
  category field — instead of inventing new ones.
