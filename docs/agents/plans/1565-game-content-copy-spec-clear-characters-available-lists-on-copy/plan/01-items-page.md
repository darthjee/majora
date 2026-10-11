# Items page

Update `docs/agents/specs/game-content-copy/items.md` to clear the per-character
`items/available.json` lists.

- **Intro:** the page has no intro paragraph under the "Part of..." block. Add one sentence
  after it, worded like `possessions.md`: the copy also adds an entry to every target
  character's list of available items, so those cached lists are cleared too.
- **Cache:** change the opening sentence so the item family is the first bullet, as
  `possessions.md` does. Then add a second bullet:
  `/games/<target>/pcs/<id>/items/available.json` for **every** PC and
  `/games/<target>/npcs/<id>/items/available.json` for **every** NPC of the target game (`pcs` vs
  `npcs` by the character's `npc` flag). Explain that these lists are built from the target
  game's characters at response time and that the copy adds an entry to each. Name
  `character_items_available` (`backend/games/views/game/items/_item_exchange.py`) as the view
  that caches them except for a hidden NPC (`X-Skip-Cache`). Clearing a hidden NPC's path anyway
  is harmless. A target game with no characters adds no such path. End with a "Nothing else needs
  clearing" line: the `items/available/all.json` variants always send `X-Skip-Cache`, and no
  character's `items.json` list changes because the copy has no owners.
- **Testing:** in the backend bullet, replace the plain "`X-Cache-Clear` paths" with: the item
  family plus one `items/available.json` path per target PC and NPC, and only the family when the
  target game has no characters.

## Files to Change

- `docs/agents/specs/game-content-copy/items.md` — intro sentence, **Cache** section, **Testing**
  bullet.
