# Frontend Plan: Add list and show STL miniatures page

Main plan: [plan.md](plan.md)

## Shared contracts

Call `Translator.t(...)` with the keys listed in [plan.md](plan.md)'s "Shared contracts" table
(`header.nav_stl_models`, `stl_models_page.loading`, `stl_model_page.loading`,
`stl_model_page.links`, `stl_model_page.sources`, `stl_model_page.tags`). If any key name changes
or a new one is needed while implementing, that's fine — `translator`'s job is to match whatever
`Translator.t(...)` calls actually land in the merged code, not this table verbatim.

## Context

Pre-existing, unchanged API surface (see `docs/agents/access-control/stl-model.md` for the full
authoritative reference):

- `GET /miniatures/stl_models.json` — paginated list, `IsAuthenticated`, `X-Skip-Cache: true`.
  Returns `StlModelListSerializer` items: `id`, `name`, `photo_url` (`null` when no photo).
- `GET /miniatures/stl_models/<id>.json` — detail, `IsAuthenticated`, `X-Skip-Cache: true`
  (including its 404). Returns `StlModelDetailSerializer`: `id`, `name`, `photo_url`, `links`
  (array of `{id, text, url, link_type}`), `sources` (array of `{name}`), `tags` (array of
  strings).
- No query filters beyond pagination (`page`/`per_page`). No write endpoints exist at all for any
  of the five `miniatures` models — don't add mutation config for them.

## Implementation Steps

### Step 1 — Resource config (`RequestStore` wiring)

Create `frontend/assets/js/utils/requests/config/stlModelConfig.js`, read-only (`GET` only),
following the shape documented in `resourceConfig.js` and used by `treasureConfig.js`:

```js
export default {
  GET: {
    collection: {
      regular: { path: () => '/miniatures/stl_models.json', permission: null },
    },
    single: {
      regular: { path: ({ id }) => `/miniatures/stl_models/${id}.json`, permission: null },
    },
  },
};
```

Confirm against `treasureConfig.js`/`resourceConfig.js` at implementation time whether a `private`
variant is required alongside `regular` even when both endpoints have exactly one form (some
configs only define `regular`; verify `resourceConfig.get()`'s lookup doesn't assume `.private`
always exists before deciding to omit it).

Register it in `frontend/assets/js/utils/requests/resourceConfig.js`: import `stlModelConfig` and
add `stlModel: stlModelConfig` to the `RESOURCES` map, alongside `treasure`, `game`, etc.

### Step 2 — List-type config

Create `frontend/assets/js/components/common/list_types/configs/stlModelListType.js`, modeled
directly on `gamesListType.js` (the no-permission, no-filter, `RequestStore`-driven template) —
**not** `globalTreasureListType.js`, which is heavier (staff/superuser gating, raw
`GenericClient`, filters) and doesn't apply here since STL models have no edit/manage concept and
no filters:

```js
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import StlModelListItem from '../StlModelListItem.js';

function fetchStlModels(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'stlModel',
    params: {},
    query: buildListQuery(hashResolver),
    canEdit: false,
  });
}

function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

function buildEmptyInfoBarItems() {
  return [];
}

function buildItemHref(item) {
  return `#/stl_models/${item.data.id}`;
}

const stlModelListType = {
  fetchList: fetchStlModels,
  wrapperClass: StlModelListItem,
  filtersComponent: null,
  photoType: 'stl_model',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 6,
};

export default stlModelListType;
```

Create the small `StlModelListItem.js` wrapper it references, mirroring `GameListItem.js`'s shape
(check that file — likely just a `BaseListItem` subclass exposing `.data` with no extra computed
fields, since STL models have no availability/status text to compute).

Register the new type in `frontend/assets/js/components/common/list_types/listTypeConfig.js`:
add `stlModels: stlModelListType` to the exported config object.

Verify `photoType: 'stl_model'` is an acceptable arbitrary string for `ActionsOverlay` (it only
needs to differ from other types, per its existing usages) — adjust if `ActionsOverlay` expects a
fixed enum.

### Step 3 — Index page

Create `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx` and
`frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx`, modeled on
`Games.jsx`/`GamesHelper.jsx` (the simplest existing index page — no access controller, no upload
modal, no filters, since none of those apply to `stl_models`):

```jsx
// StlModels.jsx
import StlModelsHelper from './helpers/StlModelsHelper.jsx';

export default function StlModels() {
  return StlModelsHelper.render();
}
```

```jsx
// helpers/StlModelsHelper.jsx
import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

export default class StlModelsHelper {
  static render() {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/" />
        </div>
        <ListPage
          type="stlModels"
          basePath="#/stl_models"
          loadingMessage={Translator.t('stl_models_page.loading')}
        />
      </>
    );
  }
}
```

No "New" button (no create endpoint exists), so no `loggedIn`-gated action is needed on this page
itself — unlike `Games.jsx`, `StlModels` doesn't need to track `loggedIn` state at all.

### Step 4 — Show page

Create `frontend/assets/js/components/resources/stl_model/pages/StlModel.jsx`,
`controllers/StlModelController.js`, and `helpers/StlModelHelper.jsx`, modeled on
`Treasure.jsx`/`TreasureController.js`/`TreasureHelper.jsx` but simplified — no `AccessStore`
permission merge (`stl_models` has no per-item edit concept):

```js
// controllers/StlModelController.js
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

export default class StlModelController extends BasePageController {
  static getStlModelIdFromHash(hash = '') {
    return BasePageController.extractParam('/stl_models/:stl_model_id', 'stl_model_id', hash);
  }

  constructor(setStlModel, setLoading, setError) {
    super();
    this.setStlModel = setStlModel;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = getCurrentHash();
      const id = StlModelController.getStlModelIdFromHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load STL model.');
        safeSet(this.setLoading, false);
      } else {
        RequestStore.ensure({
          componentName: 'StlModelController', resource: 'stlModel', quantityType: 'single', params: { id },
        })
          .then(({ data }) => safeSet(this.setStlModel, data))
          .catch(() => safeSet(this.setError, 'Unable to load STL model.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => { mounted = false; };
    };
  }
}
```

`StlModel.jsx` mirrors `Treasure.jsx`'s shape (loading/error/render states via `useState` +
`useMemo` + the controller's `buildEffect`); include `FacadeRefresh.useFacadeRefresh(controller)`
the same way `Treasure.jsx` does, for consistency with the rest of the app's refresh handling.

`StlModelHelper.render(stlModel)` should display: `name` (heading), the picture (`photo_url`) —
check how other show pages render a full-size picture (`TreasureHelper.jsx` notably does **not**
render one on its own show page; look for a shared photo/image display component used by a
show page that does, e.g. a PC/NPC/Item detail page, before deciding the exact markup), then
`links` (list of `{text, url, link_type}` — render as anchor tags), `sources` (list of `{name}`),
and `tags` (list of strings, e.g. as badges) — each under its own heading using the
`stl_model_page.links`/`sources`/`tags` translation keys. Use `BackButton href="#/stl_models"`,
`ErrorAlert`, and `LoadingMessage` the same way `TreasureHelper.jsx` does.

### Step 5 — Routing

Add to `frontend/assets/js/utils/routing/HashRouteResolver.js` (more specific pattern first):

```js
['/stl_models/:id', 'stlModel'],
['/stl_models', 'stlModels'],
```

Add to `frontend/assets/js/components/helpers/AppHelper.jsx`: import `StlModels` and `StlModel`,
add `stlModels: <StlModels />` and `stlModel: <StlModel />` to the `PAGES` map.

### Step 6 — Header link

In `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`, insert a new
`Nav.Link` between the existing "Games" link and the `HeaderNavHelper.renderAdminNavLinks(state)`
call:

```jsx
<Nav className="me-auto">
  <Nav.Link href="#/games">{Translator.t('header.nav_games')}</Nav.Link>
  {state.loggedIn && (
    <Nav.Link href="#/stl_models">{Translator.t('header.nav_stl_models')}</Nav.Link>
  )}
  {HeaderNavHelper.renderAdminNavLinks(state)}
  {HeaderNavHelper.renderGameNavLinks(state)}
  {HeaderNavHelper.renderCharacterNavLinks(state)}
</Nav>
```

This is new code, not a literal copy of an existing conditional — today `state.loggedIn` only
gates the login/logout dropdown in this same file's `renderAuthControl`; the other conditional nav
links gate on `isSuperUser`/`isStaff`/route context instead (see the issue file's "Header link
pattern" note).

### Step 7 — Tests

Add Jasmine specs mirroring the treasures/games ones:
- `StlModelsSpec.js`, `helpers/StlModelsHelperSpec.js`
- `StlModelSpec.js`, `controllers/StlModelControllerSpec.js`, `helpers/StlModelHelperSpec.js`
- `common/list_types/listTypeConfig/stlModelsSpec.js` (tests `fetchList`, `wrapperClass`,
  `buildActionBarProps`, `buildInfoBarItems`, `buildItemHref`, `itemsPerRow`)
- A header spec update/addition asserting the new link renders only when `state.loggedIn` is true

Use `frontend/specs/support/controllerStubs.js` the same way `TreasuresSpec.js`/`TreasureSpec.js`
do.

## Files to Change

- `frontend/assets/js/utils/requests/config/stlModelConfig.js` — new
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `stlModel`
- `frontend/assets/js/components/common/list_types/configs/stlModelListType.js` — new
- `frontend/assets/js/components/common/list_types/StlModelListItem.js` — new
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — register `stlModels`
- `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx` — new
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx` — new
- `frontend/assets/js/components/resources/stl_model/pages/StlModel.jsx` — new
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelController.js` — new
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx` — new
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add `stl_models`/`stl_model` routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the two new pages
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — add the header link
- Matching spec files under `frontend/specs/...` for every file above

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)

All run via `docker-compose run --rm majora_fe <script>` per this repo's convention (never invoke
`yarn`/`npm` on the host directly).

## Notes

- The exact picture-rendering markup for the show page is unresolved — `TreasureHelper.jsx`
  (the closest reference) doesn't render a picture on its own show page at all, only in the list
  card. Check a PC/NPC/Item detail page for a show-page picture pattern before implementing Step 4.
- Whether `stlModelConfig.js` needs a `private` variant alongside `regular` (Step 1) depends on an
  assumption not fully verified during planning — confirm against `resourceConfig.js`'s lookup
  code before implementing.
- Whether the STL models list/show pages should redirect or show an error when reached while
  logged out (rather than relying on the 401 from `RequestStore`) wasn't specified in the issue —
  this plan assumes existing generic 401/auth handling (if any) already covers it, matching how
  `Games.jsx`'s list itself has no explicit logged-out guard either. Flag to the user if no such
  generic handling exists.
