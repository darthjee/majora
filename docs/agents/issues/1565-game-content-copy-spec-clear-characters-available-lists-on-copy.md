# Issue: Game content copy spec: clear characters' available lists on copy

## Description

Part of the "copy content between games" epic (#1550), spawned from #1557. Copying an item,
document or faction into a target game adds an entry to every target character's
"available" list (`/games/<target>/{pcs,npcs}/<id>/{items,documents,factions}/available.json`).
The tab pages `items.md`, `documents.md` and `factions.md` under
`docs/agents/specs/game-content-copy/` only clear the content type's own family, so these lists
stay stale on every domain until a manual cache wipe.

The Possessions tab page (#1557) already clears `possessions/available.json` for every PC/NPC of
the target game on copy and on cover finalize. Recipes need nothing: their available lists are
always `X-Skip-Cache`.

## Problem

The three lists are cached. Checked in the backend:

- `character_items_available` (`backend/games/views/game/items/_item_exchange.py`),
  `character_documents_available` (`.../documents/_document_exchange.py`) and
  `character_factions_available` (`.../factions/_faction_exchange.py`) work the same way as
  `character_possessions_available`: they only send `X-Skip-Cache` for a hidden NPC.
- The `{items,documents,factions}/available/all.json` variants always send `X-Skip-Cache`
  (`build_*_available_all_view` under `backend/games/views/game/_character/`), so they need no
  clearing.
- Common items have no per-character available list, so `common-items.md` needs no change. This
  also covers common items that the Recipes tab copies as dependencies.

## Expected Behavior

- `items.md`, `documents.md` and `factions.md`: in the **Cache** section, the copy `201`
  and the cover link's finalize also clear
  `/games/<target>/pcs/<id>/<type>/available.json` for **every** PC and
  `/games/<target>/npcs/<id>/<type>/available.json` for **every** NPC of the target game (`pcs`
  vs `npcs` by the character's `npc` flag). Use the same wording and reasoning as
  `possessions.md`:
  - the list is built from the target game's characters at response time;
  - the view that caches it is named, and it skips the cache only for a hidden NPC (clearing that
    path anyway is harmless);
  - a target game with no characters adds no such path;
  - the `<type>/available/all.json` variants need no clearing because they always skip the cache.
- `documents.md`: the document's other link finalizes (pages, files, photos) do not change the
  available list's rows, so only the copy `201` and the cover finalize add these paths. They keep
  clearing just the family, as they do today.
- Each page's tests/checklist bullet that lists the `X-Cache-Clear` paths also mentions the
  per-character available paths, and says that a target with no characters gets the family only.
  This matches `possessions.md`.
- Update the intro paragraph of each page if it summarises what the copy clears, as
  `possessions.md` does.
- `common-items.md` and `recipes.md` are unchanged.
- Docs-only change. No code changes.
