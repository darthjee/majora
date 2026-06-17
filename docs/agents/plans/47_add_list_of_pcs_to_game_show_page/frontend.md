# Frontend Plan: Add list of PCs to game show page

Main plan: [plan.md](plan.md)

## Tasks

1. Add a `size` prop (`'normal' | 'small'`) to `CharacterCard.jsx` / `CharacterCardHelper.jsx`, defaulting to `'normal'`. When `'small'`, use smaller Bootstrap column classes (`col-sm-4 col-md-3 col-lg-2`) and a smaller heading class (`h6` instead of `h5`) for the card title.
2. Add a constant `MAX_PREVIEW_CHARACTERS = 6` in a small shared module `frontend/assets/js/components/elements/characterPreviewConstants.js`.
3. Create a new reusable element `frontend/assets/js/components/elements/CharacterPreviewSection.jsx` (+ `helpers/CharacterPreviewSectionHelper.jsx`):
   - Props: `characters` (array, already limited or not — component slices to `MAX_PREVIEW_CHARACTERS`), `gameSlug`, `characterType` (`'pc'|'npc'`), `title`, `seeAllHref`.
   - Renders a heading (`title`), a row of small `CharacterCard`s (sliced to the max), and a "See all <title>" link (`href={seeAllHref}`).
4. Update `GameController.js` (and `getGameSlugFromHash`) to also fetch the PCs preview list in the same effect: `client.fetch(`/games/${gameSlug}/pcs.json?per_page=${MAX_PREVIEW_CHARACTERS}`)`, exposing a new `setPcs`/`pcs` state alongside the existing `game` state. Keep this resilient — if the PCs fetch fails, the page should still render the game with an empty PCs section (don't fail the whole page on this secondary fetch).
5. Update `Game.jsx` to track `pcs` state from the controller and pass it to `GameHelper.render`.
6. Update `GameHelper.jsx`:
   - Remove rendering of the "Player Characters" button — update `GameNavLinksHelper.jsx` to drop the PCs button (keep the NPCs button as-is, since NPCs preview is out of scope for this issue).
   - Render `<CharacterPreviewSection characters={pcs} gameSlug={game.game_slug} characterType="pc" title="Player Characters" seeAllHref={`#/games/${game.game_slug}/pcs`} />` at the bottom of the page.
7. Add/update Jasmine specs: `CharacterCardSpec.js`/`CharacterCardHelperSpec.js` (size variant), `CharacterPreviewSectionSpec.js`, `CharacterPreviewSectionHelperSpec.js`, `GameControllerSpec.js` (pcs fetch), `GameHelperSpec.js` (preview section, no PCs button), `GameNavLinksHelperSpec.js` (no PCs button).

## Files

| File | Change |
|------|--------|
| `frontend/assets/js/components/elements/CharacterCard.jsx` | Add `size` prop |
| `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` | Render small variant |
| `frontend/assets/js/components/elements/characterPreviewConstants.js` | New, `MAX_PREVIEW_CHARACTERS` |
| `frontend/assets/js/components/elements/CharacterPreviewSection.jsx` | New |
| `frontend/assets/js/components/elements/helpers/CharacterPreviewSectionHelper.jsx` | New |
| `frontend/assets/js/components/pages/controllers/GameController.js` | Fetch PCs preview alongside game |
| `frontend/assets/js/components/pages/Game.jsx` | Track/pass `pcs` state |
| `frontend/assets/js/components/pages/helpers/GameHelper.jsx` | Render `CharacterPreviewSection`, drop PCs button |
| `frontend/assets/js/components/elements/helpers/GameNavLinksHelper.jsx` | Remove PCs button |
