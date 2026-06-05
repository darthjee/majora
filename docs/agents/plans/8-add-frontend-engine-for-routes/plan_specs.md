# Plan: Jasmine Specs

All spec files live under `frontend/specs/assets/js/`, mirroring the source tree.
Patterns follow the existing Majora spec style (`Spec.js` suffix, `describe`/`it`).

---

## `utils/RouteSpec.js`

```js
import Route from '../../../../assets/js/utils/Route.js';

describe('Route', function() {
  describe('#matches', function() {
    it('matches an exact path', function() {
      const route = new Route('/games', 'games');
      expect(route.matches('/games')).toBe(true);
    });

    it('matches a path with a trailing slash', function() {
      const route = new Route('/games', 'games');
      expect(route.matches('/games/')).toBe(true);
    });

    it('matches a path with a :param segment', function() {
      const route = new Route('/games/:game_slug', 'game');
      expect(route.matches('/games/my-campaign')).toBe(true);
    });

    it('matches a path with multiple :param segments', function() {
      const route = new Route('/games/:game_slug/characters/:character_id', 'character');
      expect(route.matches('/games/my-campaign/characters/42')).toBe(true);
    });

    it('does not match a partial path', function() {
      const route = new Route('/games', 'games');
      expect(route.matches('/games/extra')).toBe(false);
    });

    it('does not match an unrelated path', function() {
      const route = new Route('/games', 'games');
      expect(route.matches('/other')).toBe(false);
    });
  });

  describe('#page', function() {
    it('returns the page identifier', function() {
      const route = new Route('/games', 'games');
      expect(route.page).toBe('games');
    });
  });

  describe('#params', function() {
    it('extracts params from a matching route', function() {
      const route = new Route('/games/:game_slug/characters/:character_id', 'character');
      expect(route.params('/games/my-campaign/characters/42')).toEqual({
        game_slug: 'my-campaign',
        character_id: '42',
      });
    });

    it('returns empty object when route does not match', function() {
      const route = new Route('/games/:game_slug/characters/:character_id', 'character');
      expect(route.params('/games/my-campaign/characters')).toEqual({});
    });
  });
});
```

---

## `utils/RouterSpec.js`

```js
import Router from '../../../../assets/js/utils/Router.js';

describe('Router', function() {
  describe('instance methods', function() {
    let router;

    beforeEach(function() { router = new Router(); });

    describe('#register and #resolve', function() {
      it('resolves a registered exact route', function() {
        router.register('/games', 'games');
        expect(router.resolve('/games')).toBe('games');
      });

      it('resolves a route with a param', function() {
        router.register('/games/:game_slug', 'game');
        expect(router.resolve('/games/my-campaign')).toBe('game');
      });

      it('returns "home" for unmatched routes', function() {
        expect(router.resolve('/unknown')).toBe('home');
      });

      it('matches routes in registration order', function() {
        router.register('/games/:game_slug/characters/:character_id', 'character');
        router.register('/games/:game_slug', 'game');

        expect(router.resolve('/games/my-campaign/characters/42')).toBe('character');
        expect(router.resolve('/games/my-campaign')).toBe('game');
      });
    });
  });

  describe('class methods', function() {
    beforeEach(function()  { Router.reset(); });
    afterEach(function()   { Router.reset(); });

    describe('.register and .resolve', function() {
      it('resolves a registered route', function() {
        Router.register('/games', 'games');
        expect(Router.resolve('/games')).toBe('games');
      });

      it('returns "home" for unmatched routes', function() {
        expect(Router.resolve('/unknown')).toBe('home');
      });
    });

    describe('.extractParams', function() {
      it('extracts params from a hash route', function() {
        expect(
          Router.extractParams(
            '/games/:game_slug/characters/:character_id',
            '#/games/my-campaign/characters/42?foo=bar',
          )
        ).toEqual({ game_slug: 'my-campaign', character_id: '42' });
      });

      it('returns empty object when route does not match', function() {
        expect(
          Router.extractParams('/games/:game_slug/characters/:character_id', '#/games/my-campaign')
        ).toEqual({});
      });
    });
  });
});
```

---

## `utils/hashQueryParamsSpec.js`

```js
import getHashQueryParams from '../../../../assets/js/utils/hashQueryParams.js';

describe('getHashQueryParams', function() {
  it('returns all query params from a hash with a query string', function() {
    const params = getHashQueryParams('#/games?page=2&per_page=10');
    expect(params.get('page')).toBe('2');
    expect(params.get('per_page')).toBe('10');
  });

  it('returns empty params when hash has no query string', function() {
    expect(getHashQueryParams('#/games').toString()).toBe('');
  });

  it('returns empty params for an empty string', function() {
    expect(getHashQueryParams('').toString()).toBe('');
  });
});
```

---

## `utils/HashRouteResolverSpec.js`

```js
import HashRouteResolver from '../../../../assets/js/utils/HashRouteResolver.js';

describe('HashRouteResolver', function() {
  describe('#getPage', function() {
    it('returns "character" for character routes', function() {
      const resolver = new HashRouteResolver(() => '#/games/my-campaign/characters/42');
      expect(resolver.getPage()).toBe('character');
    });

    it('returns "gamePcs" for PC routes', function() {
      const resolver = new HashRouteResolver(() => '#/games/my-campaign/pcs');
      expect(resolver.getPage()).toBe('gamePcs');
    });

    it('returns "gameNpcs" for NPC routes', function() {
      const resolver = new HashRouteResolver(() => '#/games/my-campaign/npcs');
      expect(resolver.getPage()).toBe('gameNpcs');
    });

    it('returns "game" for game detail routes', function() {
      const resolver = new HashRouteResolver(() => '#/games/my-campaign');
      expect(resolver.getPage()).toBe('game');
    });

    it('returns "games" for the games list route', function() {
      const resolver = new HashRouteResolver(() => '#/games');
      expect(resolver.getPage()).toBe('games');
    });

    it('returns "games" for the games list route with query params', function() {
      const resolver = new HashRouteResolver(() => '#/games?page=2&per_page=10');
      expect(resolver.getPage()).toBe('games');
    });

    it('returns "home" for unrecognized routes', function() {
      const resolver = new HashRouteResolver(() => '#/other');
      expect(resolver.getPage()).toBe('home');
    });

    it('resolves routes when hash prefix is missing', function() {
      const resolver = new HashRouteResolver(() => '/games');
      expect(resolver.getPage()).toBe('games');
    });
  });

  describe('#getPaginationParams', function() {
    it('extracts page and per_page params', function() {
      const resolver = new HashRouteResolver(() => '#/games?page=3&per_page=12');
      expect(resolver.getPaginationParams().toString()).toBe('page=3&per_page=12');
    });

    it('ignores non-pagination params', function() {
      const resolver = new HashRouteResolver(() => '#/games?page=2&foo=bar&per_page=8');
      expect(resolver.getPaginationParams().toString()).toBe('page=2&per_page=8');
    });

    it('returns empty params when hash has no query string', function() {
      const resolver = new HashRouteResolver(() => '#/games');
      expect(resolver.getPaginationParams().toString()).toBe('');
    });
  });
});
```

---

## `client/GenericClientSpec.js`

```js
import GenericClient from '../../../../assets/js/client/GenericClient.js';

describe('GenericClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
  });

  describe('#fetch', function() {
    it('makes a GET request and returns parsed JSON', async function() {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      }));

      const client = new GenericClient(() => '#/games/my-campaign');
      const result = await client.fetch('/games/my-campaign.json');

      expect(fetch).toHaveBeenCalledWith('/games/my-campaign.json', jasmine.any(Object));
      expect(result).toEqual({ id: 1 });
    });

    it('forwards hash query params to the URL', async function() {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }));

      const client = new GenericClient(() => '#/games/my-campaign?foo=bar');
      await client.fetch('/games/my-campaign.json');

      expect(fetch).toHaveBeenCalledWith('/games/my-campaign.json?foo=bar', jasmine.any(Object));
    });

    it('throws when response is not ok', async function() {
      fetchSpy.and.returnValue(Promise.resolve({ ok: false }));

      const client = new GenericClient(() => '');
      await expectAsync(client.fetch('/games.json')).toBeRejectedWithError(
        'Request failed for /games.json',
      );
    });
  });

  describe('#fetchIndex', function() {
    it('returns data and pagination from response', async function() {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }]),
        headers: {
          get: (key) => ({ page: '2', pages: '5', per_page: '10' })[key] ?? null,
        },
      }));

      const client = new GenericClient(() => '#/games?page=2');
      const result = await client.fetchIndex('/games.json');

      expect(result.data).toEqual([{ id: 1 }]);
      expect(result.pagination).toEqual({ page: 2, pages: 5, perPage: 10 });
    });

    it('forwards only page and per_page params', async function() {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        headers: { get: () => null },
      }));

      const client = new GenericClient(() => '#/games?page=2&foo=bar');
      await client.fetchIndex('/games.json');

      expect(fetch).toHaveBeenCalledWith('/games.json?page=2', jasmine.any(Object));
    });
  });

  describe('#post', function() {
    it('makes a POST request with JSON body', async function() {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 5 }),
      }));

      const client = new GenericClient(() => '');
      const result = await client.post('/games.json', { name: 'My Game' });

      expect(fetch).toHaveBeenCalledWith('/games.json', jasmine.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'My Game' }),
      }));
      expect(result).toEqual({ id: 5 });
    });
  });
});
```

---

## `components/AppControllerSpec.js`

```js
import AppController from '../../../../assets/js/components/AppController.js';

describe('AppController', function() {
  describe('#getPage', function() {
    it('returns the current page from the hash', function() {
      const controller = new AppController(null, window, () => '#/games');
      expect(controller.getPage()).toBe('games');
    });

    it('returns "home" for an unrecognized hash', function() {
      const controller = new AppController(null, window, () => '#/unknown');
      expect(controller.getPage()).toBe('home');
    });
  });

  describe('#buildEffect', function() {
    it('updates page state on hashchange', function() {
      const setPage = jasmine.createSpy('setPage');
      const eventTarget = jasmine.createSpyObj('eventTarget', [
        'addEventListener',
        'removeEventListener',
      ]);

      let hashValue = '#/games';
      const controller = new AppController(setPage, eventTarget, () => hashValue);
      const cleanup = controller.buildEffect()();

      const handler = eventTarget.addEventListener.calls.mostRecent().args[1];
      hashValue = '#/games/my-campaign';
      handler();

      expect(setPage).toHaveBeenCalledWith('game');
      cleanup();
      expect(eventTarget.removeEventListener).toHaveBeenCalled();
    });
  });
});
```

---

## `components/helpers/AppHelperSpec.js`

```js
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../assets/js/components/helpers/AppHelper.jsx';

describe('AppHelper', function() {
  describe('.render', function() {
    it('renders the games page for page "games"', function() {
      const markup = renderToStaticMarkup(AppHelper.render('games', '#/games'));
      expect(markup).toContain('Games');
    });

    it('renders the games page for page "home"', function() {
      const markup = renderToStaticMarkup(AppHelper.render('home', ''));
      expect(markup).toContain('Games');
    });

    it('renders the character page for page "character"', function() {
      const markup = renderToStaticMarkup(
        AppHelper.render('character', '#/games/my-campaign/characters/42'),
      );
      expect(markup).toContain('Character');
    });
  });
});
```

---

## `components/pages/controllers/BasePageControllerSpec.js`

```js
import BasePageController from '../../../../../../assets/js/components/pages/controllers/BasePageController.js';

describe('BasePageController', function() {
  describe('#buildSafeSetter', function() {
    it('calls the setter while mounted', function() {
      const controller = new BasePageController();
      let mounted = true;
      const safeSet = controller.buildSafeSetter(() => mounted);
      const setter = jasmine.createSpy('setter');

      safeSet(setter, 'value');
      expect(setter).toHaveBeenCalledWith('value');
    });

    it('does not call the setter after unmount', function() {
      const controller = new BasePageController();
      let mounted = false;
      const safeSet = controller.buildSafeSetter(() => mounted);
      const setter = jasmine.createSpy('setter');

      safeSet(setter, 'value');
      expect(setter).not.toHaveBeenCalled();
    });
  });
});
```

---

## `components/pages/controllers/GamesControllerSpec.js`

```js
import GamesController from '../../../../../../assets/js/components/pages/controllers/GamesController.js';

describe('GamesController', function() {
  let setGames, setPagination, setLoading, setError, client;

  beforeEach(function() {
    setGames      = jasmine.createSpy('setGames');
    setPagination = jasmine.createSpy('setPagination');
    setLoading    = jasmine.createSpy('setLoading');
    setError      = jasmine.createSpy('setError');
    client        = jasmine.createSpyObj('client', ['fetchIndex', 'currentHash']);
    client.currentHash.and.returnValue('#/games');
  });

  describe('#buildEffect', function() {
    it('fetches games and updates state', async function() {
      const games = [{ id: 1, name: 'Campaign' }];
      const pagination = { page: 1, pages: 1, perPage: 10 };
      client.fetchIndex.and.returnValue(Promise.resolve({ data: games, pagination }));

      const controller = new GamesController(setGames, setPagination, setLoading, setError, client);
      const cleanup = controller.buildEffect()();

      await new Promise((r) => setTimeout(r, 0));

      expect(setGames).toHaveBeenCalledWith(games);
      expect(setPagination).toHaveBeenCalledWith(pagination);
      expect(setLoading).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('sets error on fetch failure', async function() {
      client.fetchIndex.and.returnValue(Promise.reject(new Error('fail')));

      const controller = new GamesController(setGames, setPagination, setLoading, setError, client);
      const cleanup = controller.buildEffect()();

      await new Promise((r) => setTimeout(r, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load games.');
      cleanup();
    });
  });
});
```

---

## `components/pages/controllers/GameControllerSpec.js`

```js
import GameController, { getGameSlugFromHash }
  from '../../../../../../assets/js/components/pages/controllers/GameController.js';

describe('getGameSlugFromHash', function() {
  it('extracts the game slug from a game detail hash', function() {
    expect(getGameSlugFromHash('#/games/my-campaign')).toBe('my-campaign');
  });

  it('returns empty string when hash does not match', function() {
    expect(getGameSlugFromHash('#/games')).toBe('');
  });
});

describe('GameController', function() {
  let setGame, setLoading, setError, client;

  beforeEach(function() {
    setGame   = jasmine.createSpy('setGame');
    setLoading = jasmine.createSpy('setLoading');
    setError  = jasmine.createSpy('setError');
    client    = jasmine.createSpyObj('client', ['fetch', 'currentHash']);
  });

  describe('#buildEffect', function() {
    it('fetches the game and updates state', async function() {
      const game = { id: 1, name: 'Campaign' };
      client.currentHash.and.returnValue('#/games/my-campaign');
      client.fetch.and.returnValue(Promise.resolve(game));

      const controller = new GameController(setGame, setLoading, setError, client);
      const cleanup = controller.buildEffect()();

      await new Promise((r) => setTimeout(r, 0));

      expect(client.fetch).toHaveBeenCalledWith('/games/my-campaign.json');
      expect(setGame).toHaveBeenCalledWith(game);
      expect(setLoading).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('sets error when slug is missing', async function() {
      client.currentHash.and.returnValue('#/games');

      const controller = new GameController(setGame, setLoading, setError, client);
      const cleanup = controller.buildEffect()();

      await new Promise((r) => setTimeout(r, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load game.');
      cleanup();
    });
  });
});
```

---

## `components/pages/controllers/CharacterControllerSpec.js`

```js
import CharacterController, { getCharacterParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/CharacterController.js';

describe('getCharacterParamsFromHash', function() {
  it('extracts game_slug and character_id from a character hash', function() {
    expect(
      getCharacterParamsFromHash('#/games/my-campaign/characters/42')
    ).toEqual({ game_slug: 'my-campaign', character_id: '42' });
  });

  it('returns empty strings when hash does not match', function() {
    expect(getCharacterParamsFromHash('#/games/my-campaign')).toEqual({
      game_slug: '',
      character_id: '',
    });
  });
});

describe('CharacterController', function() {
  let setCharacter, setLoading, setError, client;

  beforeEach(function() {
    setCharacter = jasmine.createSpy('setCharacter');
    setLoading   = jasmine.createSpy('setLoading');
    setError     = jasmine.createSpy('setError');
    client       = jasmine.createSpyObj('client', ['fetch', 'currentHash']);
  });

  describe('#buildEffect', function() {
    it('fetches the character and updates state', async function() {
      const character = { id: 42, name: 'Hero' };
      client.currentHash.and.returnValue('#/games/my-campaign/characters/42');
      client.fetch.and.returnValue(Promise.resolve(character));

      const controller = new CharacterController(setCharacter, setLoading, setError, client);
      const cleanup = controller.buildEffect()();

      await new Promise((r) => setTimeout(r, 0));

      expect(client.fetch).toHaveBeenCalledWith('/games/my-campaign/characters/42.json');
      expect(setCharacter).toHaveBeenCalledWith(character);
      expect(setLoading).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('sets error when either param is missing', async function() {
      client.currentHash.and.returnValue('#/games/my-campaign');

      const controller = new CharacterController(setCharacter, setLoading, setError, client);
      const cleanup = controller.buildEffect()();

      await new Promise((r) => setTimeout(r, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load character.');
      cleanup();
    });
  });
});
```

---

## `GamePcsControllerSpec.js` and `GameNpcsControllerSpec.js`

Follow the same pattern as `GameControllerSpec.js` — inject a spy client, call
`buildEffect()()`, await, and assert on `setPcs`/`setNpcs`, `setPagination`, `setLoading`,
and `setError`. Use `getGameSlugFromPcsHash` / `getGameSlugFromNpcsHash` for the
slug-extraction tests.
