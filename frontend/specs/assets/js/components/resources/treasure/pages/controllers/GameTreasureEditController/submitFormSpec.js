import GameTreasureEditController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameTreasureEditController', function() {
  describe('#submitForm', function() {
    let setTreasure;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;

    beforeEach(function() {
      setTreasure = jasmine.createSpy('setTreasure');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 42, name: 'Sword', value: 100 }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          '42',
          { name: 'Sword', value: '100', maxUnits: '10' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameTreasureEditController',
          resource: 'treasure',
          method: 'PATCH',
          quantityType: 'single',
          params: { gameSlug: 'demo', id: '42' },
          body: { name: 'Sword', value: 100, max_units: 10 },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('sends max_units as null when maxUnits is an empty string', async function() {
      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        '42',
        { name: 'Sword', value: '100', maxUnits: '' },
        { setStatus, setFieldErrors },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { name: 'Sword', value: 100, max_units: null },
      }));
    });

    it('omits max_units from the payload when the treasure is exclusive to the game', async function() {
      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        '42',
        {
          name: 'Sword', value: '100', maxUnits: '10', isExclusive: true,
        },
        { setStatus, setFieldErrors },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { name: 'Sword', value: 100 },
      }));
    });

    it('includes max_units in the payload when the treasure is linked (not exclusive)', async function() {
      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        '42',
        {
          name: 'Sword', value: '100', maxUnits: '10', isExclusive: false,
        },
        { setStatus, setFieldErrors },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { name: 'Sword', value: 100, max_units: 10 },
      }));
    });

    it('redirects to the game treasure detail page on success', async function() {
      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);
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
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);

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
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);

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
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors);

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
