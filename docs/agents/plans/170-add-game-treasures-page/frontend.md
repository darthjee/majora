# Frontend Plan: Add Game Treasures Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes:

- `GET /games/<slug>/treasures.json` — paginated list of treasures for a game
- Item shape: `{ "id": integer, "name": string, "value": integer }`
- Pagination headers: `page`, `pages`, `per_page`, `total`

Frontend route: `/games/:game_slug/treasures` → page key `gameTreasures`

## Implementation Steps

### Step 1 — Add i18n keys

Add to `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`:

```yaml
game_treasures_page:
  loading: Loading treasures...
  title: Treasures
  treasures: Treasures
```

Also add a `treasures` key under `game_page` (used in the link on the game show page):

```yaml
game_page:
  ...
  treasures: Treasures
```

### Step 2 — Add `GameTreasuresController`

Create `frontend/assets/js/components/pages/controllers/GameTreasuresController.js` following the `GamePcsController` pattern:

- Export a helper `getGameSlugFromTreasuresHash(hash)` using `Router.extractParams('/games/:game_slug/treasures', hash)`.
- The controller fetches `/games/${gameSlug}/treasures.json` via `this.client.fetchIndex(...)`.
- State setters: `setTreasures`, `setPagination`, `setLoading`, `setError`.

### Step 3 — Add `GameTreasuresHelper`

Create `frontend/assets/js/components/pages/helpers/GameTreasuresHelper.jsx` following the `TreasuresHelper` / `GameCharactersHelper` pattern:

- `static render(treasures, pagination, basePath, backHref)` — renders a list (`<ul class="list-group">`) of treasure items (name + value), a `<BackButton>`, and a `<Pagination>` element.
- `static renderLoading()` — uses `Translator.t('game_treasures_page.loading')`.
- `static renderError(error)` — renders `<ErrorAlert>`.

### Step 4 — Add `GameTreasures` page component

Create `frontend/assets/js/components/pages/GameTreasures.jsx`:

```jsx
export default function GameTreasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GameTreasuresController(setTreasures, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = getGameSlugFromTreasuresHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/treasures`;
  const backHref = `#/games/${gameSlug}`;

  if (loading) return GameTreasuresHelper.renderLoading();
  if (error) return GameTreasuresHelper.renderError(error);
  return GameTreasuresHelper.render(treasures, pagination, basePath, backHref);
}
```

### Step 5 — Register the route

In `frontend/assets/js/utils/HashRouteResolver.js`, add (before the `/games/:game_slug` catch-all):

```js
this.#router.register('/games/:game_slug/treasures', 'gameTreasures');
```

### Step 6 — Wire page in `AppHelper`

In `frontend/assets/js/components/helpers/AppHelper.jsx`:

1. Import `GameTreasures` from `'../pages/GameTreasures.jsx'`.
2. Add `gameTreasures: <GameTreasures />` to the `PAGES` map.

### Step 7 — Add link to `GameHelper`

In `frontend/assets/js/components/pages/helpers/GameHelper.jsx`, add a treasures link/section below the NPCs `CharacterPreviewSection`, following the same pattern used for the existing PC/NPC sections:

```jsx
<div className="mt-3">
  <a href={`#/games/${game.game_slug}/treasures`} className="btn btn-outline-secondary">
    {Translator.t('game_page.treasures')}
  </a>
</div>
```

Update the JSDoc on `GameHelper.render` to document that `game_slug` is used to build the treasures href.

### Step 8 — Write Jasmine specs

Following existing spec patterns:

- `frontend/specs/assets/js/components/pages/controllers/GameTreasuresControllerSpec.js` — test `buildEffect()`: successful fetch sets treasures and pagination; fetch failure sets error; missing slug sets error without fetching; mounted guard prevents state updates after unmount.
- `frontend/specs/assets/js/components/pages/helpers/GameTreasuresHelperSpec.js` — test `render`: renders each treasure name and value; `renderLoading` outputs the loading message; `renderError` outputs the error.

### Step 9 — Run frontend checks

```bash
docker-compose run --rm majora_fe yarn test
docker-compose run --rm majora_fe yarn lint
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_treasures_page` keys and `game_page.treasures`
- `frontend/assets/i18n/pt.yaml` — add matching keys in Portuguese
- `frontend/assets/js/components/pages/controllers/GameTreasuresController.js` — new controller
- `frontend/assets/js/components/pages/helpers/GameTreasuresHelper.jsx` — new helper
- `frontend/assets/js/components/pages/GameTreasures.jsx` — new page component
- `frontend/assets/js/utils/HashRouteResolver.js` — register `/games/:game_slug/treasures` route
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import and register `GameTreasures`
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — add treasures link
- `frontend/specs/assets/js/components/pages/controllers/GameTreasuresControllerSpec.js` — new spec
- `frontend/specs/assets/js/components/pages/helpers/GameTreasuresHelperSpec.js` — new spec

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `frontend-test`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-lint`)

## Notes

- The `gameTreasures` route must be registered **before** `/games/:game_slug` in `HashRouteResolver.js` — order matters because the router matches in registration order and `:game_slug` would otherwise consume `/treasures` as the slug value.
- The treasures list on the game page is read-only; no edit/create links are needed on this page.
- Treasure items link to `#/treasures/:id` (the global treasure detail page), not to a per-game detail. Adjust in the helper if per-game detail is out of scope per the issue.
