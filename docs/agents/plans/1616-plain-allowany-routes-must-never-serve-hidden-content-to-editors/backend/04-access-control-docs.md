# Update the access-control docs

Remove the deviations this issue retires and document the new routes:

- `character-photo.md` — rewrite "Hidden-NPC gate": plain GETs 404 a hidden NPC for everyone,
  the editor-aware gate remains only on writes and restricted routes. Add the
  `npcs/<id>/photos/all.json` row.
- `character.md` — remove "Hidden-detail cache deviation". Plain detail on a hidden NPC is a
  404 for everyone, and its `X-Skip-Cache` is now uniform staleness protection, not a
  per-viewer exception. Point editors to `full.json`.
- `character-item.md`, `character-document.md`, `character-treasure.md`,
  `character-faction.md`, `character-possession.md`, `character-recipe.md` — adjust every
  "plus the hidden-NPC gate" mention on a plain GET to say "404 when the NPC is hidden".
- `game-treasure.md` (and `treasure.md` if it covers the game-scoped detail) — plain detail
  404s a hidden treasure for everyone. Add the `full.json` row.
- `endpoints.md` / `principles.md` — add the new routes wherever the endpoint index lists them.
  Optionally state in the default hidden-gated collection pattern that a plain route never
  varies by role.
- Update `docs/agents/summary.md` only if a doc's abstract changes.

## Files to Change
- `docs/agents/access-control/character-photo.md`
- `docs/agents/access-control/character.md`
- `docs/agents/access-control/character-{item,document,treasure,faction,possession,recipe}.md`
- `docs/agents/access-control/game-treasure.md`, `treasure.md`
- `docs/agents/access-control/endpoints.md`, `principles.md`
