# Access-control docs

Extend `docs/agents/access-control/character-recipe.md`:

- Replace the "arrives in #1459" sentence with the real content.
- Add an "Available / acquire / remove" section with the PC/NPC endpoint table: tiers,
  `X-Skip-Cache`, the 400 → 404 → 422 order, the plain vs `/full.json` success shapes, and
  remove's 204/404 rules (E6, E8).
- Add a "Permissions" section: the `game_pc_recipe` / `game_npc_recipe` `endpoints.yml` and
  `ui.yml` files, and the `can_exchange_recipe` flag.
- Record the known limitation (a hidden link can be inferred) and the rule that the hidden-NPC
  gate comes first (E7).

If the access-control index or the permissions reference list resources or page flags, add the
new resources and flag there too. Keep the Markdown lint-clean (line length, table formatting),
as in the existing file.

## Files to Change
- `docs/agents/access-control/character-recipe.md` — document the new endpoints, configs and flag
- Access-control / permissions index docs, if they enumerate resources or flags — add entries
