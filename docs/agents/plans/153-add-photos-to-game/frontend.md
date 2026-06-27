# Frontend Plan: Add photos to game

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes the `photos` field from `GET /games/<slug>.json`:

```json
"photos": [
  { "id": 1, "url": "https://example.com/img1.jpg" }
]
```

- `photos` is always present in the game detail response; empty array when no photos exist.
- Each item has `id` (integer) and `url` (string).
- The `Game` component already fetches `/games/<slug>.json` and stores the result in `game` state.

## Implementation Steps

### Step 1 — Update `GameHelper.render` to display photos

The existing `CharacterPhotos` component (`frontend/assets/js/components/elements/CharacterPhotos.jsx`) already accepts `photos` (array of `{ id, url }`) and `alt` (string) and renders a photo gallery. Reuse it for game photos.

Update `GameHelper.render` in `frontend/assets/js/components/pages/helpers/GameHelper.jsx`:

1. Import `CharacterPhotos`.
2. After the main game info row (name, description, cover photo), add a `<CharacterPhotos>` section rendering `game.photos` with `alt={game.name}`.

Example placement in the returned JSX (after the description row, before the character preview sections):

```jsx
<CharacterPhotos photos={game.photos} alt={game.name} />
```

`CharacterPhotos` already handles the `undefined`/empty case by rendering nothing, so no conditional guard is needed.

### Step 2 — Update `GameHelperSpec.js`

In `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js`, add specs:

- Renders photo URLs when `game.photos` contains items.
- Renders nothing for photos when `game.photos` is empty.
- Renders nothing for photos when `game.photos` is undefined/absent.

Pass `photos` as part of the `game` object in the spec (e.g. `{ ...game, photos: [{ id: 1, url: 'http://...' }] }`).

## Files to Change

- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — import `CharacterPhotos` and render `game.photos`
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` — add photo rendering specs

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- `CharacterPhotos` is already generic — no changes needed to that component.
- The `Game.jsx` component passes `game` directly to `GameHelper.render(game, pcs, npcs)`, so `game.photos` will be available as soon as the backend returns it.
- No changes needed to `GameController.js` — the game fetch already stores the full response object in state.
