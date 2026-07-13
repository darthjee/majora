import GameTreasureNewController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameTreasureNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let treasureClient;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      treasureClient.createGameTreasure.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, name: 'Golden Crown', value: 500, game_slug: 'demo' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameTreasureNewController(setError, setFieldErrors, treasureClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          { name: 'Golden Crown', value: '500' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(treasureClient.createGameTreasure).toHaveBeenCalledWith(
          'demo', 'tok-abc', { name: 'Golden Crown', value: 500 },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new treasure detail page on success', async function() {
      const controller = new GameTreasureNewController(setError, setFieldErrors, treasureClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Golden Crown', value: '500' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      treasureClient.createGameTreasure.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new GameTreasureNewController(setError, setFieldErrors, treasureClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', value: '0' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      treasureClient.createGameTreasure.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameTreasureNewController(setError, setFieldErrors, treasureClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Golden Crown', value: '500' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      treasureClient.createGameTreasure.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTreasureNewController(setError, setFieldErrors, treasureClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Golden Crown', value: '500' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameTreasureNewController(setError, setFieldErrors, treasureClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Golden Crown', value: '500' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
