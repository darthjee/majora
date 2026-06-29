# Frontend Plan: Add Treasures

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend consumes the backend API. The backend agent provides these endpoints:

| Method | URL | Response |
|--------|-----|----------|
| `GET` | `/treasures.json` | `[{id, name, value}]` (paginated) |
| `POST` | `/treasures.json` | `{id, name, value}` (201) |
| `GET` | `/treasures/<id>.json` | `{id, name, value}` |
| `PATCH` | `/treasures/<id>.json` | `{id, name, value}` |
| `GET` | `/treasures/<id>/access.json` | `{can_edit: bool}` |

All four Treasure page components and their controllers/helpers already exist under `frontend/assets/js/components/pages/`. The `TreasureClient` already exists. What is missing is:
1. The hash routes registered in `HashRouteResolver.js`
2. The page mappings in `AppHelper.jsx`

The translator agent provides the i18n keys; this agent only needs to ensure the pages call the correct keys (which they already do, as the helpers are implemented).

## Implementation Steps

### Step 1 — Add treasure routes to `HashRouteResolver.js`

In `frontend/assets/js/utils/HashRouteResolver.js`, register four treasure routes inside the constructor, before the existing `/games` routes (or in any logical order — specificity is already handled by registration order since Treasure routes don't overlap with Game routes):

```js
this.#router.register('/treasures/new', 'treasureNew');
this.#router.register('/treasures/:id/edit', 'treasureEdit');
this.#router.register('/treasures/:id', 'treasure');
this.#router.register('/treasures', 'treasures');
```

Note: `/treasures/new` must be registered before `/treasures/:id` so the literal `new` segment is not captured as an id.

### Step 2 — Wire treasure pages into `AppHelper.jsx`

In `frontend/assets/js/components/helpers/AppHelper.jsx`:
1. Import the four Treasure page components at the top alongside the existing imports:
   ```js
   import Treasure from '../pages/Treasure.jsx';
   import TreasureEdit from '../pages/TreasureEdit.jsx';
   import TreasureNew from '../pages/TreasureNew.jsx';
   import Treasures from '../pages/Treasures.jsx';
   ```
2. Add entries to the `PAGES` map:
   ```js
   treasures: <Treasures />,
   treasure: <Treasure />,
   treasureNew: <TreasureNew />,
   treasureEdit: <TreasureEdit />,
   ```

### Step 3 — Run checks

```
docker-compose run --rm majora_fe npm test
docker-compose run --rm majora_fe npm run lint
```

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — add four treasure routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import and map four Treasure page components

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- The route order `/treasures/new` before `/treasures/:id` is critical — the Router resolves in registration order.
- The existing specs in `frontend/specs/` for TreasureClient and the four controllers already cover the client and controller logic. No new specs need to be added for the wiring changes (HashRouteResolver and AppHelper have their own specs if they exist, but no new test files are required for this issue).
- The `i18n_check` CI step will fail if `en.yaml` and `pt.yaml` are out of sync; the translator agent handles that.
