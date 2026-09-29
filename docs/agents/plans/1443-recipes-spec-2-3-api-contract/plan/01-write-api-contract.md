# Write the API contract page
Create `docs/agents/specs/recipes/api-contract.md` in the style of the access-control pages
(endpoint tables with Endpoint / Method / Who can call, then Fields and Write fields). Transcribe
every decision in the issue's Solution section. Organize it as:

1. **Conventions:** pagination (every index uses standard pagination), ordering (`id`, except
   recipe → characters by name then `id`), `X-Skip-Cache: true` on every restricted
   (`/all`, `/full`, `available/all`) variant, and the Navi rule (plain URLs only).
2. **Response shapes:**
   - index item: `id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`, `output`;
   - detail adds `description`, `ingredients`, `checks`;
   - `hidden` on `/all` and `/full` only;
   - nested `output: {id, name, photo_path, category} | null` (masked);
   - **no recipe `photo_path`**;
   - the visible and masked JSON examples.
3. **Game recipes:** `recipes.json` (GET with `?category=`, where an unknown value returns an
   empty list and masked recipes never match on plain; POST), `recipes/all.json` (real-category
   filter), `recipes/<id>.json` (GET; PATCH), `recipes/<id>/full.json`. Write fields
   (`game_common_item_id` flat) and validation, covering edge cases E1–E3:
   - a hidden output item gets `400` on the regular tier;
   - the write response masks the output according to the caller's tier;
   - PATCH on a hidden recipe gets `404` on the regular tier.
   No photo upload.
4. **Common item → recipes:** plain returns `404` if the common item is hidden or unknown; `/all`
   is GameEdit. Same item shape, no `?category=`.
5. **Recipe → characters:**
   - plain returns `{id, name, photo_path, type}` with `type` `'pc'` or `'npc'`, `404`s if the
     recipe is hidden, excludes hidden links and hidden or incognito NPCs, and sets no
     `X-Skip-Cache`;
   - `/all` adds `hidden` (the `CharacterRecipe` flag).
6. **Character recipes:**
   - index/detail with `<character_recipe_id>`;
   - `?name=` on the lists;
   - `available` / `available/all` (with `?name=`);
   - `acquire` / `acquire/all` / `remove` / `remove/all` with `{game_recipe_id}` in the body;
     E4 (duplicate returns `422`, cross-game returns `400`), E7 (hidden-NPC gate first), E8
     (unknown link returns `404`);
   - the `hidden`-only PATCH (CharacterEdit for PCs, GameEdit for NPCs, no `404` on hidden rows,
     `/full` response);
   - E9 (`GameRecipe.hidden` ignored on character endpoints, output still masked).
7. **Permissions:**
   - the `game_recipe`, `game_pc_recipe` and `game_npc_recipe` `endpoints.yml` keys, and tiers
     per the issue's Permissions tables;
   - `can_create_recipe` on `/permissions/game.json`;
   - `/permissions/game_recipe.json` (`can_edit`);
   - `can_exchange_recipe` on `/permissions/game_pc.json` / `game_npc.json`.
8. **Shortlists and Navi:** the three `?per_page=5` shortlists and their `short_*` resources, plus
   which plain endpoints need regular (paginated) Navi resources. No resources for restricted
   variants or write endpoints.

Link the page from `docs/agents/specs/recipes.md`'s "Aspect pages" list, replacing the
"API contract … pending, added by #1443" line with a real link.

## Files to Change
- `docs/agents/specs/recipes/api-contract.md` — new contract page.
- `docs/agents/specs/recipes.md` — link the contract (drop "pending").
