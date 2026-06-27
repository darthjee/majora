import GameEditController, { getGameSlugFromEditHash }
  from '../../../../../../assets/js/components/pages/controllers/GameEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('GameEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug from an edit hash', function() {
    expect(getGameSlugFromEditHash('#/games/demo/edit')).toBe('demo');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(getGameSlugFromEditHash('#/games/demo')).toBe('');
  });

  describe('#buildEffect', function() {
    it('fetches game and access in parallel and calls setGame with merged result', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, () => {}, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', null);
        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
        expect(setGame).toHaveBeenCalledWith({ name: 'Demo', game_slug: 'demo', can_edit: true });
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets can_edit to false when access response is not ok', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, () => {}, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setGame).toHaveBeenCalledWith(
          jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
        );
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error when the game fetch fails', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, () => {}, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setGame).not.toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Unable to load game.');
        expect(setLoading).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sends the token when the user is authenticated', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      AuthStorage.setToken('tok-abc');

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, () => {}, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', 'tok-abc');
        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', 'tok-abc');

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#submitForm', function() {
    let setGame;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let gameClient;

    beforeEach(function() {
      setGame = jasmine.createSpy('setGame');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      gameClient = jasmine.createSpyObj('gameClient', ['updateGame']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      gameClient.updateGame.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameEditController(setGame, setLoading, setError, setFieldErrors, gameClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          { name: 'New Name', photo: 'http://example.com/p.png', description: 'Great game' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(gameClient.updateGame).toHaveBeenCalledWith(
          'demo',
          'tok-abc',
          { name: 'New Name', photo: 'http://example.com/p.png', description: 'Great game' },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the game detail page on success', async function() {
      const controller = new GameEditController(setGame, setLoading, setError, setFieldErrors, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'New Name', photo: '', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      gameClient.updateGame.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GameEditController(setGame, setLoading, setError, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'X', photo: '', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      gameClient.updateGame.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameEditController(setGame, setLoading, setError, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'New Name', photo: '', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      gameClient.updateGame.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameEditController(setGame, setLoading, setError, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'New Name', photo: '', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameEditController(setGame, setLoading, setError, setFieldErrors, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Demo', photo: '', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
