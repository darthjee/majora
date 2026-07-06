import GameTreasureEditController
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasureEditController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameTreasureEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
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
