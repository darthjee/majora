# Frontend Plan: Add back button

Main plan: [plan.md](plan.md)

## Shared contracts

- Character detail data now comes from `GET /games/:game_slug/npcs/:character_id.json` (NPCs) or `GET /games/:game_slug/pcs/:character_id.json` (PCs) instead of the old `characters/:character_id.json` endpoint. Same JSON shape as before.
- New routes: `/games/:game_slug/npcs/:character_id` (page key `npcCharacter`) and `/games/:game_slug/pcs/:character_id` (page key `pcCharacter`). Old route `/games/:game_slug/characters/:character_id` (page key `character`) is removed.

## Tasks

1. Add a reusable `BackButton` element:
   - `frontend/assets/js/components/elements/BackButton.jsx` — takes a `href` prop (hash path) and renders a link styled as a back button.
   - `frontend/assets/js/components/elements/helpers/BackButtonHelper.jsx` — rendering helper, consistent with the existing element/helper split pattern.
2. Update `frontend/assets/js/utils/HashRouteResolver.js`:
   - Remove `register('/games/:game_slug/characters/:character_id', 'character')`.
   - Add `register('/games/:game_slug/npcs/:character_id', 'npcCharacter')` and `register('/games/:game_slug/pcs/:character_id', 'pcCharacter')` (registered before the plain `npcs`/`pcs` routes so the more specific pattern matches first).
3. Split `CharacterController.js` into two controllers (or parameterize one):
   - `frontend/assets/js/components/pages/controllers/NpcCharacterController.js` (and `getNpcCharacterParamsFromHash`, using route `/games/:game_slug/npcs/:character_id`, fetching `/games/${game_slug}/npcs/${character_id}.json`)
   - `frontend/assets/js/components/pages/controllers/PcCharacterController.js` (and `getPcCharacterParamsFromHash`, fetching `/games/${game_slug}/pcs/${character_id}.json`)
   - Remove `CharacterController.js`.
4. Split `Character.jsx` page into `NpcCharacter.jsx` and `PcCharacter.jsx`, each using their respective controller. Both can reuse `CharacterHelper` for rendering, passing a back link to the respective index page (`#/games/:game_slug/npcs` or `#/games/:game_slug/pcs`).
5. Update `CharacterHelper.jsx` `render` to accept a `backHref` and render `<BackButton href={backHref} />`.
6. Update `frontend/assets/js/components/helpers/AppHelper.jsx`: replace `character: <Character />` with `npcCharacter: <NpcCharacter />` and `pcCharacter: <PcCharacter />`.
7. Update `CharacterCardHelper.jsx` to build the href based on a new `characterType` ('pc' | 'npc') prop instead of the old `characters/:id` path, and thread `characterType` through `CharacterCard.jsx` and `GameCharactersHelper.render`.
8. Update `GamePcs.jsx` to pass `characterType="pc"` and `GameNpcs.jsx` to pass `characterType="npc"` through `GameCharactersHelper.render`.
9. Add `BackButton` usage (back to parent page) on:
   - `Games.jsx`/`GamesHelper.jsx` → back to `#/`
   - `Game.jsx`/`GameHelper.jsx` → back to `#/games`
   - `GamePcs.jsx`/`GameCharactersHelper.jsx` → back to `#/games/:game_slug` (passed in as a prop, since the helper is shared with NPCs)
   - `GameNpcs.jsx` → back to `#/games/:game_slug`
   - `NpcCharacter.jsx` → back to `#/games/:game_slug/npcs`
   - `PcCharacter.jsx` → back to `#/games/:game_slug/pcs`
10. Update/add Jasmine specs for: `BackButton`, `HashRouteResolver` (new routes), `NpcCharacterController`/`PcCharacterController`, `NpcCharacter`/`PcCharacter` pages, `CharacterCardHelper` (link per `characterType`), `AppHelper`, and the updated helpers above.

## Files

| File | Change |
|------|--------|
| `frontend/assets/js/components/elements/BackButton.jsx` | New |
| `frontend/assets/js/components/elements/helpers/BackButtonHelper.jsx` | New |
| `frontend/assets/js/utils/HashRouteResolver.js` | Replace `character` route with `npcCharacter`/`pcCharacter` |
| `frontend/assets/js/components/pages/controllers/CharacterController.js` | Removed, replaced by `NpcCharacterController.js` and `PcCharacterController.js` |
| `frontend/assets/js/components/pages/Character.jsx` | Removed, replaced by `NpcCharacter.jsx` and `PcCharacter.jsx` |
| `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` | Accept `backHref`, render `BackButton` |
| `frontend/assets/js/components/helpers/AppHelper.jsx` | Update `PAGES` map |
| `frontend/assets/js/components/elements/CharacterCard.jsx` | Thread `characterType` prop |
| `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` | Build href from `characterType` |
| `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` | Thread `characterType`, render `BackButton` |
| `frontend/assets/js/components/pages/GamePcs.jsx` | Pass `characterType="pc"` |
| `frontend/assets/js/components/pages/GameNpcs.jsx` | Pass `characterType="npc"` |
| `frontend/assets/js/components/pages/helpers/GameHelper.jsx` | Render `BackButton` to `#/games` |
| `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` | Render `BackButton` to `#/` |
