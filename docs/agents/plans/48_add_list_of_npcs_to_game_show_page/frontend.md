# Frontend Plan: Add list of NPCs to game show page

Main plan: [plan.md](plan.md)

## Tasks

1. Update `GameController.js`: alongside the existing PCs preview fetch, add an NPCs preview fetch (`client.fetch(`/games/${gameSlug}/npcs.json?per_page=${MAX_PREVIEW_CHARACTERS}`)`), exposing a new `setNpcs`/`npcs` state. Resilient to failure the same way as PCs (empty array on error, doesn't fail the page).
2. Update `Game.jsx` to track `npcs` state from the controller and pass it to `GameHelper.render`.
3. Update `GameHelper.jsx`:
   - Render a second `<CharacterPreviewSection characters={npcs} gameSlug={game.game_slug} characterType="npc" title="Non-Player Characters" seeAllHref={`#/games/${game.game_slug}/npcs`} />` below the existing PCs preview section.
4. Update `GameNavLinksHelper.jsx` to remove the remaining "Non-Player Characters" button (the PCs button was already removed in #47), so the nav-links block has no buttons left — remove `GameNavLinks` usage from `GameHelper.jsx` entirely if it renders nothing.
5. Update/add Jasmine specs: `GameControllerSpec.js` (npcs fetch), `GameHelperSpec.js` (both preview sections, no nav buttons), `GameNavLinksHelperSpec.js`/`GameNavLinksSpec.js` (empty nav links or removal).

## Files

| File | Change |
|------|--------|
| `frontend/assets/js/components/pages/controllers/GameController.js` | Fetch NPCs preview alongside game/PCs |
| `frontend/assets/js/components/pages/Game.jsx` | Track/pass `npcs` state |
| `frontend/assets/js/components/pages/helpers/GameHelper.jsx` | Render second `CharacterPreviewSection`, drop `GameNavLinks` |
| `frontend/assets/js/components/elements/GameNavLinks.jsx` | Remove if no longer used |
| `frontend/assets/js/components/elements/helpers/GameNavLinksHelper.jsx` | Remove if no longer used |
