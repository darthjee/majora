import GameEditController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameEditController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
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
          { name: 'New Name', description: 'Great game' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(gameClient.updateGame).toHaveBeenCalledWith(
          'demo',
          'tok-abc',
          { name: 'New Name', description: 'Great game' },
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
          { name: 'New Name', description: '' },
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
        { name: 'X', description: '' },
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
        { name: 'New Name', description: '' },
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
        { name: 'New Name', description: '' },
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
          { name: 'Demo', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
