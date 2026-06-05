# Plan: Page Components and Controllers

## Page stubs (`frontend/assets/js/components/pages/`)

Each page is a stub — renders a placeholder `<div>` with the page name. Full UI is out
of scope for this issue.

```jsx
// Games.jsx
export default function Games() { return <div>Games</div>; }

// Game.jsx
export default function Game() { return <div>Game</div>; }

// GamePcs.jsx
export default function GamePcs() { return <div>Game PCs</div>; }

// GameNpcs.jsx
export default function GameNpcs() { return <div>Game NPCs</div>; }

// Character.jsx
export default function Character() { return <div>Character</div>; }
```

## Header stub (`frontend/assets/js/components/elements/Header.jsx`)

Required by `AppHelper`. Stub for now.

```jsx
export default function Header() {
  return <header><h1>Majora</h1></header>;
}
```

---

## `frontend/assets/js/components/pages/controllers/BasePageController.js`

Same as Oak but without `checkLogin` — Majora has no authentication.

```js
export default class BasePageController {
  buildSafeSetter(isMounted) {
    return (setter, value) => {
      if (!isMounted()) return;
      setter(value);
    };
  }
}
```

---

## `GamesController.js`

Fetches the games list via `fetchIndex`. No params needed.

```js
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

export default class GamesController extends BasePageController {
  constructor(setGames, setPagination, setLoading, setError, client = null) {
    super();
    this.setGames = setGames;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      this.#loadData(safeSet);
      return () => { mounted = false; };
    };
  }

  #loadData(safeSet) {
    this.#fetchGames()
      .then(({ games, pagination }) => {
        safeSet(this.setGames, games);
        safeSet(this.setPagination, pagination);
      })
      .catch((error) => safeSet(this.setError, error?.message || 'Unable to load games.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchGames() {
    return this.client.fetchIndex('/games.json')
      .then(({ data, pagination }) => ({
        games: Array.isArray(data) ? data : [],
        pagination,
      }))
      .catch(() => { throw new Error('Unable to load games.'); });
  }
}
```

---

## `GameController.js`

Extracts `game_slug` from the hash and fetches the game detail.

```js
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

export function getGameSlugFromHash(hash = '') {
  return Router.extractParams('/games/:game_slug', hash).game_slug || '';
}

export default class GameController extends BasePageController {
  constructor(setGame, setLoading, setError, client = null) {
    super();
    this.setGame = setGame;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getGameSlugFromHash(this.client.currentHash());
      this.#loadData(safeSet, slug);
      return () => { mounted = false; };
    };
  }

  #loadData(safeSet, slug) {
    this.#fetchGame(slug)
      .then((game) => safeSet(this.setGame, game))
      .catch((error) => safeSet(this.setError, error?.message || 'Unable to load game.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchGame(slug) {
    if (!slug) return Promise.reject(new Error('Unable to load game.'));
    return this.client.fetch(`/games/${slug}.json`)
      .catch(() => { throw new Error('Unable to load game.'); });
  }
}
```

---

## `GamePcsController.js`

Extracts `game_slug` from the `/games/:game_slug/pcs` pattern and fetches the PCs list.

```js
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

export function getGameSlugFromPcsHash(hash = '') {
  return Router.extractParams('/games/:game_slug/pcs', hash).game_slug || '';
}

export default class GamePcsController extends BasePageController {
  constructor(setPcs, setPagination, setLoading, setError, client = null) {
    super();
    this.setPcs = setPcs;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getGameSlugFromPcsHash(this.client.currentHash());
      this.#loadData(safeSet, slug);
      return () => { mounted = false; };
    };
  }

  #loadData(safeSet, slug) {
    this.#fetchPcs(slug)
      .then(({ pcs, pagination }) => {
        safeSet(this.setPcs, pcs);
        safeSet(this.setPagination, pagination);
      })
      .catch((error) => safeSet(this.setError, error?.message || 'Unable to load PCs.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchPcs(slug) {
    if (!slug) return Promise.reject(new Error('Unable to load PCs.'));
    return this.client.fetchIndex(`/games/${slug}/pcs.json`)
      .then(({ data, pagination }) => ({
        pcs: Array.isArray(data) ? data : [],
        pagination,
      }))
      .catch(() => { throw new Error('Unable to load PCs.'); });
  }
}
```

---

## `GameNpcsController.js`

Same structure as `GamePcsController`, using the `/games/:game_slug/npcs` pattern.

```js
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

export function getGameSlugFromNpcsHash(hash = '') {
  return Router.extractParams('/games/:game_slug/npcs', hash).game_slug || '';
}

export default class GameNpcsController extends BasePageController {
  constructor(setNpcs, setPagination, setLoading, setError, client = null) {
    super();
    this.setNpcs = setNpcs;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getGameSlugFromNpcsHash(this.client.currentHash());
      this.#loadData(safeSet, slug);
      return () => { mounted = false; };
    };
  }

  #loadData(safeSet, slug) {
    this.#fetchNpcs(slug)
      .then(({ npcs, pagination }) => {
        safeSet(this.setNpcs, npcs);
        safeSet(this.setPagination, pagination);
      })
      .catch((error) => safeSet(this.setError, error?.message || 'Unable to load NPCs.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchNpcs(slug) {
    if (!slug) return Promise.reject(new Error('Unable to load NPCs.'));
    return this.client.fetchIndex(`/games/${slug}/npcs.json`)
      .then(({ data, pagination }) => ({
        npcs: Array.isArray(data) ? data : [],
        pagination,
      }))
      .catch(() => { throw new Error('Unable to load NPCs.'); });
  }
}
```

---

## `CharacterController.js`

Extracts both `game_slug` and `character_id` from the hash.

```js
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

export function getCharacterParamsFromHash(hash = '') {
  return {
    game_slug: '',
    character_id: '',
    ...Router.extractParams('/games/:game_slug/characters/:character_id', hash),
  };
}

export default class CharacterController extends BasePageController {
  constructor(setCharacter, setLoading, setError, client = null) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { game_slug, character_id } = getCharacterParamsFromHash(this.client.currentHash());
      this.#loadData(safeSet, game_slug, character_id);
      return () => { mounted = false; };
    };
  }

  #loadData(safeSet, slug, id) {
    this.#fetchCharacter(slug, id)
      .then((character) => safeSet(this.setCharacter, character))
      .catch((error) => safeSet(this.setError, error?.message || 'Unable to load character.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchCharacter(slug, id) {
    if (!slug || !id) return Promise.reject(new Error('Unable to load character.'));
    return this.client.fetch(`/games/${slug}/characters/${id}.json`)
      .catch(() => { throw new Error('Unable to load character.'); });
  }
}
```
