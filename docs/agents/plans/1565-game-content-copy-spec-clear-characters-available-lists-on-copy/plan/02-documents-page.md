# Documents page

Update `docs/agents/specs/game-content-copy/documents.md` to clear the per-character
`documents/available.json` lists. Its **Cache** section differs from the other pages because
every link finalize clears the document family. Only the copy `201` and the **cover** link's
finalize also clear the available lists.

- **Intro:** extend the existing intro paragraph (the "richest copyable type" one) with a
  sentence like `possessions.md`'s: the copy also adds an entry to every target character's list
  of available documents, so those cached lists are cleared too.
- **Cache:** keep the family list and the page-list paragraph as they are. Add a new paragraph
  after the page-lists paragraph. It says the copy `201` and the cover link's finalize also clear
  `/games/<target>/pcs/<id>/documents/available.json` for **every** PC and
  `/games/<target>/npcs/<id>/documents/available.json` for **every** NPC of the target game (`pcs`
  vs `npcs` by `npc` flag). It gives the same reasoning as `possessions.md`, naming
  `character_documents_available` (`backend/games/views/game/documents/_document_exchange.py`).
  - The other link finalizes (non-cover photos, files, file photos) don't change the list row
    (`id`, `name`, `photo_path`), so they don't clear these paths.
  - The `documents/available/all.json` variants always send `X-Skip-Cache`.
  - No character's `documents.json` list changes because the copy has no owners.
- **Testing:** in the backend bullet, extend "`X-Cache-Clear` paths, including the page lists on
  the copy `201`". It must now say: plus one `documents/available.json` path per target PC and
  NPC on the copy `201` and the cover finalize (only the family when the target game has no
  characters), and not on the other finalizes.

## Files to Change

- `docs/agents/specs/game-content-copy/documents.md` — intro, **Cache** section, **Testing**
  bullet.
