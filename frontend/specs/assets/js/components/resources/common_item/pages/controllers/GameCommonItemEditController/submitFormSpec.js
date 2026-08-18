import GameCommonItemEditController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameCommonItemEditController', function() {
  let setCommonItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;

  beforeEach(function() {
    setCommonItem = jasmine.createSpy('setCommonItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
  });

  describe('#submitForm', function() {
    let setStatus;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 5, name: 'New Name' }),
      }));
    });

    it('prevents default, resets status/errors, and PATCHes the fields payload', async function() {
      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event,
        'demo',
        '5',
        {
          name: 'New Name', description: 'Cozy', price: '250', category: 'gear', hidden: true,
        },
        { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'GameCommonItemEditController',
        resource: 'commonItem',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
        body: {
          name: 'New Name', description: 'Cozy', price: 250, category: 'gear', hidden: true,
        },
      });
    });

    it('redirects to the common item detail page on success', async function() {
      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          '5',
          {
            name: 'New Name', description: '', price: '0', category: 'other', hidden: false,
          },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/common_items/5');
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

      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '5',
        {
          name: 'X', description: '', price: '0', category: 'other', hidden: false,
        },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );

      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '5',
        {
          name: 'New Name', description: '', price: '0', category: 'other', hidden: false,
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '5',
        {
          name: 'New Name', description: '', price: '0', category: 'other', hidden: false,
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        'demo',
        '5',
        {
          name: 'New Name', description: '', price: '0', category: 'other', hidden: false,
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });
  });
});
