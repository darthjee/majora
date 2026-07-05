import GameTreasureEditController, { getGameTreasureEditParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/GameTreasureEditController.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('GameTreasureEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug and treasure id from an edit hash', function() {
    expect(getGameTreasureEditParamsFromHash('#/games/demo/treasures/42/edit')).toEqual({
      game_slug: 'demo', treasure_id: '42',
    });
  });

  it('returns empty strings when the hash does not match the edit route', function() {
    expect(getGameTreasureEditParamsFromHash('#/games/demo/treasures/42')).toEqual({
      game_slug: '', treasure_id: '',
    });
  });

  describe('#buildEffect', function() {
    let setTreasure;
    let setLoading;
    let setError;
    let treasureClient;
    let gameClient;
    let fakeWindow;

    beforeEach(function() {
      setTreasure = jasmine.createSpy('setTreasure');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      treasureClient = jasmine.createSpyObj('treasureClient', ['fetchGameTreasure']);
      gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      fakeWindow = { location: { hash: '#/games/demo/treasures/42/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));
      treasureClient.fetchGameTreasure.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 42, name: 'Sword', value: 100, game_slug: 'demo' }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new GameTreasureEditController(
      setTreasure, setLoading, setError, Noop.noop, treasureClient, gameClient,
    );

    it('fetches the game-scoped treasure and calls setTreasure when the user can edit', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
      expect(treasureClient.fetchGameTreasure).toHaveBeenCalledWith('demo', '42', null);
      expect(setTreasure).toHaveBeenCalledWith(
        { id: 42, name: 'Sword', value: 100, game_slug: 'demo' },
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the treasures index and does not fetch when the user cannot edit', async function() {
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: false }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      expect(treasureClient.fetchGameTreasure).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the treasures index when the access response is not ok', async function() {
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      expect(treasureClient.fetchGameTreasure).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the treasures index when the access request throws', async function() {
      gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      expect(treasureClient.fetchGameTreasure).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the treasure fetch fails', async function() {
      treasureClient.fetchGameTreasure.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', 'tok-abc');
      expect(treasureClient.fetchGameTreasure).toHaveBeenCalledWith('demo', '42', 'tok-abc');

      cleanup();
    });
  });

  describe('#submitForm', function() {
    let setTreasure;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let treasureClient;
    let gameClient;

    beforeEach(function() {
      setTreasure = jasmine.createSpy('setTreasure');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      treasureClient = jasmine.createSpyObj('treasureClient', ['updateGameTreasure']);
      gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      treasureClient.updateGameTreasure.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 42, name: 'Sword', value: 100 }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameTreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient, gameClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          '42',
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(treasureClient.updateGameTreasure).toHaveBeenCalledWith(
          'demo', '42', 'tok-abc', { name: 'Sword', value: 100 },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the game treasure detail page on success', async function() {
      const controller = new GameTreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient, gameClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          '42',
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures/42');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      treasureClient.updateGameTreasure.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GameTreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient, gameClient,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '42',
        { name: 'X', value: '1' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      treasureClient.updateGameTreasure.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameTreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient, gameClient,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '42',
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      treasureClient.updateGameTreasure.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient, gameClient,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '42',
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
