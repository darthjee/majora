# Write the frontend spec page
Create `docs/agents/specs/recipes/frontend.md`, same tone and density as the sibling aspect
pages, citing the files found in step 01. Sections:

1. **Placement and navigation** — the decision and its rationale: own "Recipes" entry in the
   Game dropdown (`IS_GAME_PAGE`), not a section in Common Items; PC/NPC show-page shortlist +
   full list page + "Recipes" entry in the PC/NPC dropdowns. List every route.
2. **Game recipe pages** (Document pages, simplified — no pages, no files/photos gallery, no
   upload buttons):
   - List: thumbnail from `output.photo_path` / "unknown" placeholder when `output` is `null`,
     name, "<item> × <yield>", category filter like Tasks (`?category=`; masked recipes never
     match). "New" link gated by `can_create_recipe`.
   - Show: all fields; markdown rendering of `description`/`ingredients`/`checks`;
     `crafting_cost` via `TreasureMoney`; output link or "unknown" placeholder; "Known by"
     shortlist; edit link gated by `can_edit` from `/permissions/game_recipe.json`.
   - New/Edit: field-by-field editor mapping (`MoneyEditModal` `context="treasure"`,
     `MarkdownEditor`, output selector, `yield_quantity`, `crafting_time`, `hidden` for editors);
     `400` handling for a rejected output item.
3. **Shortlists** (`?per_page=5`, editors get `/all.json?per_page=5` via the resolver): PC/NPC
   page "Recipes", recipe page "Known by" (mixed PC/NPC entries, linking to the right kind),
   common item page "Recipes that produce it".
4. **Character recipes** — full list page, detail, exchange modal (`ResourceExchangeModal` with
   Acquire/Remove tabs, trigger gated by `can_exchange_recipe`), GM variants
   (`available/all`, `acquire/all`, `remove/all`) and the GM `hidden` toggle via
   `PATCH .../recipes/<character_recipe_id>.json`; `422` duplicate and `404` handling.
5. **Request wiring** — a new `recipeConfig.js` (and any character-recipe config) with
   `regular`/`private` variants per quantity type, and the `RequestPermissionResolvers.js`
   entries (game-level `can_edit` vs character-level `can_edit`), referencing
   `docs/agents/issue-enhancement.md`.
6. **i18n** — list of new yaml files (en + pt) and keys, e.g. `game_recipes_page`,
   `recipe_page`, `recipe_new_page`, `recipe_edit_page`, `character_recipes_page`,
   `character_recipes_preview`, `recipe_characters_preview`, `common_item_recipes_preview`,
   `recipe_exchange_modal`, plus `game_page.recipes` and the PC/NPC nav label.
7. **Split between #1449 and #1450** — which pages/sections each implementation issue owns
   (game pages + common item shortlist + "Known by" → #1449; character sections, full page,
   exchange modal, hidden toggle → #1450).

## Files to Change
- `docs/agents/specs/recipes/frontend.md` — new page.
