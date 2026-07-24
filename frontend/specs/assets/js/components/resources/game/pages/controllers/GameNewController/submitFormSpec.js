import GameNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext } from './support.js';

describe('GameNewController', function() {
  let setError;
  let setFieldErrors;
  let setStatus;

  beforeEach(function() {
    ({ setError, setFieldErrors, setStatus } = buildContext());
    spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
      status: 201,
      json: () => Promise.resolve({ game_slug: 'new-game' }),
    }));
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      AuthStorage.setToken('tok-abc');

      const controller = new GameNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          { name: 'New Game', description: 'An adventure.', game_type: 'deadlands' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameNewController',
          resource: 'game',
          method: 'POST',
          quantityType: 'collection',
          params: {},
          body: { name: 'New Game', description: 'An adventure.', game_type: 'deadlands' },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the game detail page on 201 success', async function() {
      AuthStorage.setToken('tok-abc');

      const controller = new GameNewController(setError, setFieldErrors);
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
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GameNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'X', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      AuthStorage.setToken('tok-abc');
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameNewController(setError, setFieldErrors);

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

      const controller = new GameNewController(setError, setFieldErrors);

      try {
        await controller.submitForm(
          undefined,
          { name: 'New Game', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/users/register');
        expect(RequestStore.mutate).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the network request throws', async function() {
      AuthStorage.setToken('tok-abc');
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'New Game', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      AuthStorage.setToken('tok-abc');

      const controller = new GameNewController(setError, setFieldErrors);
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
