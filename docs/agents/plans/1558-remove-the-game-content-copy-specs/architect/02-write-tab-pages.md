# Write the per-tab pages

Create `docs/agents/game-content-copy/` with one page per tab: `items.md`, `common-items.md`,
`recipes.md`, `documents.md`, `factions.md`, `possessions.md`. Each one comes from the matching
spec page, checked against its copy type in `backend/staff/copy_types_<tab>.py` (and
`copy_recipe_common_item.py` / `copy_document_associations.py` where relevant), its
`copy_links.py` entry and `copy_cache_paths.py`.

Keep per page, as implemented: Model, Copied fields, Not copied, Photo/Files (hard-linked
files and cover), Names, `## Cache` (**required anchor**: the exact `X-Cache-Clear` paths) and
tab-specific Frontend notes. Also keep tab-specific sections: `recipes.md` `## Common item`
(**required anchor**) and its Recipes and Common items interaction, `documents.md` pages,
ready filter, file photos and large documents, `factions.md` `## Names` (**required anchor**,
linked from `access-control/staff-copy.md`).

Drop `## Testing` and per-tab `## API` blocks that only restate the endpoint shape. Link to
`access-control/staff-copy.md` instead. Each page starts with a link back to
`../game-content-copy.md`.

## Files to Change

- `docs/agents/game-content-copy/items.md`: new.
- `docs/agents/game-content-copy/common-items.md`: new.
- `docs/agents/game-content-copy/recipes.md`: new.
- `docs/agents/game-content-copy/documents.md`: new.
- `docs/agents/game-content-copy/factions.md`: new.
- `docs/agents/game-content-copy/possessions.md`: new.
