# Issue: Recipes spec (3/3): frontend design and placement

## Description
Part of #1441 (crafting recipes). Third and last spec phase, after the domain spec (#1442: `docs/agents/specs/recipes.md` → `recipes/game-recipe.md`, `character-recipe.md`, `visibility.md`, `deletion.md`, `permissions.md`) and the API contract (#1443: `recipes/api-contract.md`). Frontend placement was explicitly deferred to this issue. Docs only — no code changes.

## Problem
The frontend sub-issues (#1449 game Recipes pages, #1450 character recipes) have no agreed design: where recipes appear in navigation, what each page shows, how endpoint variants are selected, and which i18n keys exist. Without a spec, each implementation would re-decide these.

## Expected Behavior
- `docs/agents/specs/recipes/frontend.md` exists and is linked from `docs/agents/specs/recipes.md` (dropping its "pending" marker).
- The placement decision (below) is recorded.
- Every page/section below is specified against the #1443 contract.
- Docs only — no code changes.

## Solution
Write `recipes/frontend.md` with the **frontend** agent's input, covering:

- **Placement / navigation** (decided):
  - Game recipes get their **own "Recipes" entry in the header "Game" dropdown** (`#/games/:gameSlug/recipes`), next to Common Items — not a section inside Common Items. Visible to everyone in the game (same `IS_GAME_PAGE` rule as Common Items); hidden recipes are filtered by the API.
  - Character recipes get a **shortlist section on the PC/NPC show page** (`?per_page=5`, "see all" link) **plus a full list page** with a "Recipes" entry in the PC/NPC dropdowns — like Documents/Items.
- **Game recipe pages** (modeled on the Document pages, simplified — no pages concept, no files/photos gallery, no upload buttons):
  - **List** — thumbnail (the output common item's `output.photo_path`, or the "unknown" placeholder when `output` is `null`), name, output "<item> × <yield>", category filter like the Tasks page.
  - **Show / New / Edit** — `crafting_cost` via `TreasureMoney` + `MoneyEditModal` (`context="treasure"`) like `CommonItemPriceField.jsx`; `description` / `ingredients` / `checks` via `MarkdownEditor` like `CommonItemDescriptionField.jsx` on new/edit, rendered as markdown on show; output selector over the game's common items; masked output rendered as the "unknown" placeholder.
- **Shortlists** (`?per_page=5`, same pattern as other character sections):
  - "Recipes" on the PC/NPC page.
  - "Known by" on the recipe show page (mixed PC/NPC list).
  - "Recipes" (that produce it) on the common item show page.
- **Character recipes** — list, available/acquire/remove UI (Remove tab searches the character's list with `?name=`), GM variant for hidden recipes (`acquire/all`, `remove/all`, `available/all`), GM toggle of `CharacterRecipe.hidden` via `PATCH /pcs|npcs/<id>/recipes/<character_recipe_id>.json`. The exchange trigger is gated by `can_exchange_recipe` from `/permissions/game_pc.json` / `game_npc.json`.
- **Endpoint-variant selection** through `RequestStore` / `RequestPermissionResolvers.js` (see `docs/agents/issue-enhancement.md`); the create link is gated by `can_create_recipe`.
- **i18n keys** to add.

**Binding decisions from #1443's enhancement pass:**
- No uploads of any kind on recipes — no `GameRecipePhoto`, no photo-upload UI, no own `photo_path`.
- Thumbnails always come from the output item; masked output falls back to the "unknown" placeholder.

**Out of scope:** any code (#1449 / #1450 implement it); re-deciding domain rules or the API contract.

## Benefits
Gives #1449 and #1450 a single reviewed frontend design to implement, consistent with the domain spec and API contract, completing the recipes spec before implementation starts.
