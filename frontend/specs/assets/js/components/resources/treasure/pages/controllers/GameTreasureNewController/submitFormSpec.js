import GameTreasureNewController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureNewController.js';
import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildTreasure } from '../../../../../../../../support/factories.js';

describe('GameTreasureNewController', function() {
  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve(buildTreasure({ id: 7, game_slug: 'demo' })),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameTreasureNewController(setError, setFieldErrors);
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
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameTreasureNewController',
          resource: 'treasure',
          method: 'POST',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          body: { name: 'Golden Crown', value: 500 },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new treasure detail page on success', async function() {
      const controller = new GameTreasureNewController(setError, setFieldErrors);
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
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new GameTreasureNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', value: '0' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameTreasureNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Golden Crown', value: '500' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTreasureNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Golden Crown', value: '500' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameTreasureNewController(setError, setFieldErrors);
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
