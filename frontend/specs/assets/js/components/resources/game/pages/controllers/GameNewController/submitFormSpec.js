import GameNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';
import { buildContext } from './support.js';

describe('GameNewController', function() {
  let setError;
  let setFieldErrors;
  let setStatus;
  let gameClient;

  beforeEach(function() {
    ({ setError, setFieldErrors, setStatus, gameClient } = buildContext());
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      AuthStorage.setToken('tok-abc');
      gameClient.createGame.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ game_slug: 'new-game' }),
      }));

      const controller = new GameNewController(setError, setFieldErrors, gameClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          { name: 'New Game', description: 'An adventure.' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(gameClient.createGame).toHaveBeenCalledWith(
          'tok-abc',
          { name: 'New Game', description: 'An adventure.' },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the game detail page on 201 success', async function() {
      AuthStorage.setToken('tok-abc');
      gameClient.createGame.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ game_slug: 'new-game' }),
      }));

      const controller = new GameNewController(setError, setFieldErrors, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'New Game', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/new-game');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      AuthStorage.setToken('tok-abc');
      gameClient.createGame.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GameNewController(setError, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        { name: 'X', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      AuthStorage.setToken('tok-abc');
      gameClient.createGame.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameNewController(setError, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        { name: 'New Game', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('redirects to register when unauthenticated', async function() {
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new GameNewController(setError, setFieldErrors, gameClient);

      try {
        await controller.submitForm(
          undefined,
          { name: 'New Game', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/users/register');
        expect(gameClient.createGame).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the network request throws', async function() {
      AuthStorage.setToken('tok-abc');
      gameClient.createGame.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameNewController(setError, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        { name: 'New Game', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      AuthStorage.setToken('tok-abc');
      gameClient.createGame.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ game_slug: 'demo' }),
      }));

      const controller = new GameNewController(setError, setFieldErrors, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
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
