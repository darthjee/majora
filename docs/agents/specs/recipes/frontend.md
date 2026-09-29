# Frontend

Frontend design for `GameRecipe` and `CharacterRecipe`, implemented by #1449 (game pages) and
#1450 (character recipes). Part of the [Recipes spec](../recipes.md) (phase 3/3, #1444). Every
URL, variant, flag and status code used here comes from the [API contract](api-contract.md);
nothing in the contract or the domain pages is re-decided.

Paths below are relative to `frontend/assets/js/` unless they start with `frontend/` or `docs/`.

**Binding (from #1443):** recipes have **no uploads of any kind** — no photo gallery, no upload
buttons, no recipe `photo_path`. The only image is the output common item's
`output.photo_path`; when `output` is `null` (masked) or has no photo, the "unknown" placeholder
is shown.

## Placement and navigation

### Decision

- **Game recipes get their own "Recipes" entry in the header "Game" dropdown**, next to Common
  Items — not a section inside the Common Items page. Recipes are a separate collection with
  their own filter, create flow and "Known by" list; nesting them inside Common Items would
  overload that page and hide recipes whose output is masked.
- The entry uses the same `IS_GAME_PAGE` rule as Common Items (everyone in the game sees it);
  hidden recipes are filtered by the API, not by the nav.
- **Character recipes** get a **shortlist section on the PC/NPC show page** plus a **full list
  page** reached from a new "Recipes" entry in the PC/NPC dropdowns — the same shape as
  Documents / Items.

### Nav entries

In `components/common/header/helpers/HeaderNavHelper.jsx`:

- `NAV_LINK_REGISTRY`: `gameItem('recipes', '/recipes', 'game_page.recipes')` (default rule
  `IS_GAME_PAGE`), placed right after `common-items` in `NAV_LINK_GROUPS`.
- `characterItems(kind)`: a `recipes` entry with label `character_page.recipes_title`, after
  documents.

### Routes

Registered in `utils/routing/HashRouteResolver.js` (`ROUTES`, specific paths before `:id`,
character routes above `/games/:game_slug/pcs/:character_id`) and mapped to page elements in
`components/helpers/AppHelper.jsx` (`PAGES`). No `accessRouteConfig.js` entry (Common Items and
Documents have none either). `category` is already in `FILTER_KEYS`.

| Hash route | Page key | Issue |
|---|---|---|
| `#/games/:game_slug/recipes/new` | `gameRecipeNew` | #1449 |
| `#/games/:game_slug/recipes/:id/edit` | `gameRecipeEdit` | #1449 |
| `#/games/:game_slug/recipes/:id` | `gameRecipe` | #1449 |
| `#/games/:game_slug/recipes` | `gameRecipes` | #1449 |
| `#/games/:game_slug/pcs/:character_id/recipes/:id` | `pcCharacterRecipe` | #1450 |
| `#/games/:game_slug/pcs/:character_id/recipes` | `pcCharacterRecipes` | #1450 |
| `#/games/:game_slug/npcs/:character_id/recipes/:id` | `npcCharacterRecipe` | #1450 |
| `#/games/:game_slug/npcs/:character_id/recipes` | `npcCharacterRecipes` | #1450 |

On character routes `:id` is the `CharacterRecipe` row id (`<character_recipe_id>` in the
contract).

## Game recipe pages

Modeled on the Common Item pages (`components/resources/common_item/pages/GameCommonItem*.jsx`),
which have a real PATCH edit form, with the Document pages' simplicity: no pages concept, no
files/photos gallery, no upload buttons, no photo modal.

### List — `#/games/:game_slug/recipes`

- `GameRecipes.jsx` + controller + helper, rendering `PageActions` + `<ListPage type="recipes"/>`,
  like `GameCommonItems.jsx`.
- List type `common/list_types/configs/recipeListType.js` (registered in `listTypeConfig.js`):
  `fetchList` via `fetchRequestStoreList({resource: 'recipe', quantityType: 'collection'})`,
  `photoType: 'recipe'`, `buildItemHref` → `#/games/:slug/recipes/:id`,
  `buildInfoBarItems: buildItemInfoBarItems('game_recipes_page.hidden_label')` (the `hidden`
  badge only appears on `/all.json` items).
- Each card shows the **thumbnail**, the **name**, and the output line
  `"<output.name> × <yield_quantity>"`; with a masked output it reads
  `"<game_recipes_page.unknown_output> × <yield_quantity>"`.
- **Thumbnail:** new `common/cards/CardRecipeImage.jsx`, registered as `recipe` in
  `PHOTO_COMPONENTS` (`common/misc/ActionsOverlay.jsx`). It renders `output.photo_path` and falls
  back to the existing common-item placeholder
  (`frontend/assets/images/placeholders/default_common_item.png`) when `output` is `null` or has
  no photo. No new image asset.
- **Category filter:** a `RecipeFilters` `filtersComponent` rendering a `FilterSelect` over the
  `GameCommonItem.category` choices (labels `common_item_page.category.<value>`), following the
  Tasks filter (`game/pages/elements/TaskFilters.jsx`, `helpers/TaskFiltersHelper.jsx`,
  `controllers/TaskFiltersController.js`): hash `?category=` is validated against the choice
  list, forwarded to the API through `buildListQuery(hashResolver)`, and changing it resets to
  page 1 via `buildFilteredHref`. On the plain endpoint masked recipes never match a category;
  the frontend does nothing special about it.
- **"New" button** gated on `can_create_recipe`, read from
  `AccessStore.ensureGamePermissions(gameSlug)` exactly like `can_create_common_item` in
  `GameCommonItemsController`.

### Show — `#/games/:game_slug/recipes/:id`

- `GameRecipe.jsx` driven by a new show type `common/show_page/show_types/configs/recipeShowType.js`
  (`left` / `right` / `bottom` slots with `{Show, New, Edit}` variants, registered in
  `showTypeConfig.js`), like `commonItemShowType.js`.
- Fields shown: name, thumbnail (as in the list), output (link to
  `#/games/:slug/common_items/:output.id`, or the "unknown" placeholder and
  `recipe_page.unknown_output` text when `output` is `null`), `yield_quantity`, `crafting_time`
  (omitted when blank), `crafting_cost` via `<TreasureMoney value={crafting_cost}/>`.
- `description`, `ingredients`, `checks` rendered as markdown through `DescriptionBox`
  (`ReactMarkdown` + `remark-breaks`), each with its own heading; empty ones are omitted.
- `hidden` badge when the `/full.json` variant is served (editors only).
- **"Known by" shortlist** — see [Shortlists](#shortlists).
- **Edit link** gated on `can_edit` from `GET /permissions/game_recipe.json` (role-simulated,
  `regular.edit`), read the same way the common item show page reads
  `/permissions/game_common_item.json`.
- A plain `404` (hidden or unknown recipe) renders the standard not-found state.

### New / Edit — `#/games/:game_slug/recipes/new`, `.../:id/edit`

`GameRecipeNew.jsx` / `GameRecipeEdit.jsx`, using the `New` / `Edit` variants of the show-type
slots. `GameRecipeNewController` redirects to the list when `!permissions.can_create_recipe`.

| Field | Editor |
|---|---|
| `name` | text input, like `CommonItemNameField` (required, ≤200) |
| `game_common_item_id` (output) | output selector (below), required on create |
| `yield_quantity` | integer input, min 1, default 1 |
| `crafting_time` | text input, ≤200, optional |
| `crafting_cost` | `TreasureMoney` + button opening `<MoneyEditModal context="treasure"/>`, like `CommonItemPriceField.jsx` / `GameCommonItemEditModals.jsx`; default 0 |
| `description`, `ingredients`, `checks` | `MarkdownEditor`, like `CommonItemDescriptionField.jsx` |
| `hidden` | switch, like `CommonItemHiddenField` — shown to every editor, since `hidden` is writable on the regular tier |

- **Output selector:** `common/forms/SingleResourcePickerField.jsx` in API mode,
  `picker={{resource: 'commonItem', maxEntries: 5, params: {gameSlug}}}`, value `{id, name}`
  (precedent: the task session picker, `buildSessionPicker` in `game/pages/taskSessions.js`).
  The `commonItem` resolver already picks `common_items/all.json` for `GameEdit` callers, so only
  they can choose a hidden output (E1). On edit, a masked current output shows as the "unknown"
  placeholder; leaving it untouched does not send `game_common_item_id`.
  - **Dependency:** the picker searches with `?name=`, which `common_items.json` /
    `common_items/all.json` do not accept today (the contract's "no `?name=`" note is about the
    recipe index). #1449 must either add a `?name=` substring filter to the common-item indexes
    (a `backend` change outside the recipes contract, with its own data-access/security review)
    or, if rejected at planning time, fall back to a `FilterSelect` loading the first page of the
    common-item index.
- **Submit:** POST `recipe.collection` / PATCH `recipe.single` through `RequestStore.mutate`
  (regular === private URLs, as in `commonItemConfig.js`), body limited to the write fields
  above, then `RequestStore.purge({resource: 'recipe'})`.
- **Errors:** a `400` on `game_common_item_id` (other game, unknown, or hidden output for a
  regular-tier caller — indistinguishable by design) shows
  `recipe_{new,edit}_page.errors.invalid_output` under the selector; other `400` field errors
  show under their fields.
- **Hiding as a regular-tier caller:** if a caller without `GameEdit` saves with `hidden: true`,
  the recipe becomes unreachable to them (E2/E3). After a successful save the page redirects to
  the list instead of the show page, with `recipe_{new,edit}_page.hidden_notice`.

## Shortlists

All shortlists use `common/cards/ShortList.jsx` with `MAX_PREVIEW_ITEMS = 5`
(`query: {per_page: 5}`); editors get the `/all.json?per_page=5` variant through the resolver.
Each needs a `shortListResourceConfig.js` entry, a `PREVIEW_LIST_TYPES` entry in
`characterPreviewConstants.js`, and a `buildShortListSlot(...)` slot in the host show type.

| Host page | Resource / quantity type | URL (plain) | Entry card / link | See all | Issue |
|---|---|---|---|---|---|
| PC / NPC show — "Recipes" | `characterRecipe.collection` | `/games/:slug/pcs\|npcs/:id/recipes.json?per_page=5` | recipe card (thumbnail + name) → `#/games/:slug/pcs\|npcs/:id/recipes/:character_recipe_id` | `characterResourceSeeAllHref('recipe', ctx)` → `.../recipes` | #1450 |
| Recipe show — "Known by" | `recipe.characters` | `/games/:slug/recipes/:id/characters.json?per_page=5` | character card; href by `type` (`'npc'` → `npcs`, else `pcs`), like `FactionCharacterCardHelper.jsx#buildHref` | none (no full "known by" page) | #1449 |
| Common item show — "Recipes that produce it" | `recipe.commonItemCollection` | `/games/:slug/common_items/:id/recipes.json?per_page=5` | recipe card → `#/games/:slug/recipes/:id` | none | #1449 |

- Slots go in the `right` arrays of `pcShowType.js` / `npcShowType.js` (`buildShortListSlot('recipe')`),
  `recipeShowType.js` (`buildShortListSlot('recipeCharacter')`) and `commonItemShowType.js`
  (`buildShortListSlot('commonItemRecipe')`).
- "Known by" is the first mixed PC/NPC shortlist: its `renderItem` / `buildHref` must branch on
  the entry's `type`, since the existing `pc` / `npc` entries are separate.
- Empty shortlists show their `.empty` key (e.g. `character_recipes_preview.empty`).

## Character recipes

### Full list — `#/games/:game_slug/pcs|npcs/:character_id/recipes`

- `PcCharacterRecipes.jsx` / `NpcCharacterRecipes.jsx` → shared `CharacterRecipes.jsx`
  (`characterKind`, `listType="pc-recipes" | "npc-recipes"`, `isPc`), modeled on
  `shared/CharacterDocuments.jsx`: `CharacterContextController(..., 'recipes')`, `PageActions`,
  the "Exchange" button, `<ListPage type=... context={{characterId}} refreshToken/>`.
- List types in `common/list_types/configs/recipeListTypes.js` (`'pc-recipes'` /
  `'npc-recipes'`), `photoType: 'recipe'`, hidden badge via
  `buildItemInfoBarItems('character_recipes_page.hidden_label')`, hrefs to the character recipe
  detail.
- Hidden rows appear only for callers served `/all.json` (character-level `can_edit` for PCs,
  game-level for NPCs — see [Request wiring](#request-wiring)).

### Detail — `#/games/:game_slug/pcs|npcs/:character_id/recipes/:id`

- Read-only view of the entry: same fields and markdown rendering as the game recipe show page
  (display fields come from the linked `GameRecipe`), plus a link to the game recipe
  (`#/games/:slug/recipes/:game_recipe_id`). That link may `404` for non-editors when
  `GameRecipe.hidden` is true (E9) — accepted; the character detail page itself still works.
- **Hidden toggle:** a switch (like `ItemHiddenField.jsx`) shown when the caller was served
  `/full.json`; toggling sends
  `PATCH /games/:slug/pcs|npcs/:id/recipes/:character_recipe_id.json` with `{hidden}` only
  (`RequestStore.mutate({resource: 'characterRecipe', method: 'PATCH', quantityType: 'single'})`),
  then purges `characterRecipe`. There is no separate edit route — `hidden` is the only writable
  field.
- `404` (hidden row for non-editors, unknown row, other character's row, hidden NPC) renders the
  standard not-found state.

### Exchange modal (acquire / remove)

- Trigger: an "Exchange" button on the full list page, gated on **`can_exchange_recipe`** from
  `GET /permissions/game_pc.json` / `game_npc.json`, resolved like `can_exchange_treasure` in
  `shared/CharacterTreasures.jsx` (`resolveExchangeButtonCanEdit`) — unlike the Documents page,
  which does not gate its button. Add `can_exchange_recipe` to
  `utils/access/store/AccessStorePermissions.js` and merge it through
  `controllers/CharacterAccessResolver.js`.
- `<ResourceExchangeModal tabs={recipeExchangeTabs} defaultTab="acquire"/>`, with
  `elements/recipeExchangeTabs.js` (`acquire` / `remove`, labels
  `recipe_exchange_modal.{acquire,remove}_tab[_tooltip]`) and tabs
  `elements/tabs/AcquireRecipeTab.jsx` / `RemoveRecipeTab.jsx`, built on
  `tabs/shared/ExchangeDetailPane.jsx`.
- **Acquire tab** (after `AcquireDocumentTab.jsx`): browses `characterRecipe.availableCollection`
  (`available.json` / `available/all.json`, `?name=` search, 300 ms debounce, `per_page` 10) and
  POSTs `characterRecipe.acquire` with `variantName: character.gameCanEdit ? 'private' : 'regular'`
  and body **`{game_recipe_id}` only** — unlike documents there is **no hidden switch**: the new
  row copies `GameRecipe.hidden`, and the GM toggles it afterwards on the detail page.
- **Remove tab** (after `RemoveDocumentTab.jsx`): browses the character's own list
  (`characterRecipe.collection` with `?name=`) and POSTs `characterRecipe.remove` with
  `variantName: character.canEdit ? 'private' : 'regular'` (character-level for PCs; for NPCs
  `canEdit` already reflects GameEdit), body `{game_recipe_id}`.
- **Errors** (mapped through an `ERROR_KEY_BY_MESSAGE`-style table): `422` on acquire →
  `recipe_exchange_modal.errors.already_known`; `404` → `recipe_exchange_modal.errors.not_found`;
  `400` → `recipe_exchange_modal.errors.invalid`. On success (`201` / `204`) purge
  `characterRecipe` and `recipe` and bump the page's `refreshToken`.

## Request wiring

Per [`docs/agents/issue-enhancement.md`](../../issue-enhancement.md), read variants are chosen by
`RequestStore` through `utils/requests/RequestPermissionResolvers.js`, never by calling
`AccessStore` directly; mutations pass an explicit `variantName` derived from the already-resolved
character/game permissions.

### `utils/requests/config/recipeConfig.js` (resource `recipe`, #1449)

| Method / quantity type | `regular` | `private` (`permission: 'can_edit'`, `skipCache`) |
|---|---|---|
| GET `collection` | `/games/:slug/recipes.json` | `/games/:slug/recipes/all.json` |
| GET `single` | `/games/:slug/recipes/:id.json` | `/games/:slug/recipes/:id/full.json` |
| GET `characters` | `/games/:slug/recipes/:id/characters.json` | `.../characters/all.json` |
| GET `commonItemCollection` | `/games/:slug/common_items/:commonItemId/recipes.json` | `.../recipes/all.json` |
| POST `collection` | `/games/:slug/recipes.json` | same |
| PATCH `single` | `/games/:slug/recipes/:id.json` | same |

Resolvers `recipe.*` are **game-level**: `AccessStore.ensureGamePermissions(gameSlug)`, whose
`can_edit` is GameEdit. This is deliberately **not** the `can_edit` of
`/permissions/game_recipe.json` (which is `regular.edit`, staff + player, and only gates the edit
link).

### `utils/requests/config/characterRecipeConfig.js` (resource `characterRecipe`, #1450)

Params `{gameSlug, kind: 'pcs'|'npcs', id, characterRecipeId}`.

| Method / quantity type | `regular` | `private` |
|---|---|---|
| GET `collection` | `/:kind/:id/recipes.json` | `/:kind/:id/recipes/all.json` (`can_edit`, `skipCache`) |
| GET `single` | `.../recipes/:characterRecipeId.json` | `.../recipes/:characterRecipeId/full.json` (`can_edit`, `skipCache`) |
| GET `availableCollection` | `.../recipes/available.json` (`skipCache`) | `.../recipes/available/all.json` (`can_edit`, `skipCache`) |
| POST `acquire` | `.../recipes/acquire.json` | `.../recipes/acquire/all.json` |
| POST `remove` | `.../recipes/remove.json` | `.../recipes/remove/all.json` |
| PATCH `single` | `.../recipes/:characterRecipeId.json` | same |

(All paths are under `/games/:slug`.) Resolvers:

- `collection`, `single` → **character-level** `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`
  (`can_edit` = CharacterEdit for PCs, GameEdit for NPCs), like `document.collection`.
- `availableCollection` → **game-level** `ensureGamePermissions` (GameEdit, no owner leniency),
  like `document.availableCollection`, so an owning player never sees the hidden catalog.

Both configs are registered in `utils/requests/resourceConfig.js` (`RESOURCES`).

## i18n

One YAML per namespace in `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`, keys in
parity (checked by the `translator` agent's script, see `docs/agents/i18n.md`).

| File / namespace | Keys (indicative) | Issue |
|---|---|---|
| `game_page.yaml` → `game_page.recipes` | nav label | #1449 |
| `game_recipes_page.yaml` | `title`, `new_button`, `hidden_label`, `unknown_output`, `yield_format`, `category_filter_label`, `empty` | #1449 |
| `recipe_page.yaml` | `edit_button`, `output_label`, `unknown_output`, `yield_label`, `crafting_time_label`, `crafting_cost_label`, `description_title`, `ingredients_title`, `checks_title`, `hidden_label`, `known_by_title` | #1449 |
| `recipe_new_page.yaml` / `recipe_edit_page.yaml` | `title`, `name_label`, `output_label`, `output_placeholder`, `yield_label`, `crafting_time_label`, `crafting_cost_label`, `description_label`, `ingredients_label`, `checks_label`, `hidden_label`, `submit`, `hidden_notice`, `errors.invalid_output` | #1449 |
| `recipe_characters_preview.yaml` | `empty` | #1449 |
| `common_item_recipes_preview.yaml` | `title`, `empty` | #1449 |
| `common.yaml` → `character_page.recipes_title` | PC/NPC nav label and shortlist title | #1450 |
| `character_recipes_page.yaml` | `title`, `exchange_button`, `hidden_label`, `empty` | #1450 |
| `character_recipe_page.yaml` | `game_recipe_link`, `hidden_toggle_label` (+ the field labels shown) | #1450 |
| `character_recipes_preview.yaml` | `empty` | #1450 |
| `common.yaml` → `recipe_exchange_modal.*` | `acquire_tab`, `acquire_tab_tooltip`, `remove_tab`, `remove_tab_tooltip`, `acquire_button`, `remove_button`, `search_placeholder`, `errors.already_known`, `errors.not_found`, `errors.invalid` | #1450 |

A new top-level key placed in `common.yaml` (e.g. `recipe_exchange_modal`) must also be added to
`commonNamespaces` in `frontend/assets/i18n/{en,pt}/index.js`.

## Split between #1449 and #1450

- **#1449 (after #1446):** the Game-dropdown nav entry, game recipe routes, list / show / new /
  edit pages, `recipeListType`, `recipeShowType`, `CardRecipeImage`, `RecipeFilters`,
  `recipeConfig.js` + resolvers, `can_create_recipe` in `AccessStorePermissions.js`, the output
  selector (and its `?name=` dependency above), the "Known by" and "Recipes that produce it"
  shortlists, and their i18n.
- **#1450 (after #1447):** the PC/NPC dropdown entry, character recipe routes, the full list and
  detail pages, the PC/NPC show-page shortlist, the exchange modal and tabs, the hidden toggle,
  `can_exchange_recipe` wiring, `characterRecipeConfig.js` + resolvers, and their i18n. It reuses
  `CardRecipeImage` from #1449 if already merged, or introduces it otherwise.
