# Factions page

Update `docs/agents/specs/game-content-copy/factions.md` to clear the per-character
`factions/available.json` lists.

- **Intro:** extend the existing intro paragraph with a sentence like `possessions.md`'s: the
  copy also adds an entry to every target character's list of available factions, so those
  cached lists are cleared too.
- **Cache:** change the opening sentence so the faction family is the first bullet, as
  `possessions.md` does. Keep the `GameResourceCachePaths('factions')` explanation and the
  member-lists note. Then add a second bullet:
  `/games/<target>/pcs/<id>/factions/available.json` for **every** PC and
  `/games/<target>/npcs/<id>/factions/available.json` for **every** NPC of the target game. Give
  the same reasoning as `possessions.md`, naming `character_factions_available`
  (`backend/games/views/game/factions/_faction_exchange.py`). Note that the
  `factions/available/all.json` variants always send `X-Skip-Cache`. Keep the existing "A `422`
  creates nothing and clears nothing." line.
- **Testing:** in the backend bullet, replace "`X-Cache-Clear` paths" with: the faction family
  plus one `factions/available.json` path per target PC and NPC, and only the family when the
  target game has no characters. Also add that a `422` clears nothing.

## Files to Change

- `docs/agents/specs/game-content-copy/factions.md` — intro, **Cache** section, **Testing**
  bullet.
