import BaseCharacterPossessionEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterPossessionEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('BaseCharacterPossessionEditController', function() {
  let setPossession;
  let setLoading;
  let setError;
  let setFieldErrors;
  let setStatus;
  let client;

  beforeEach(function() {
    setPossession = jasmine.createSpy('setPossession');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    setStatus = jasmine.createSpy('setStatus');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 42, name: 'New Name' }),
    }));
  });

  describe('#submitForm', function() {
    it('prevents default, resets status/errors, and PATCHes the GamePossession id directly', async function() {
      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event, 'demo', '7', '5', 42, { name: 'New Name', description: 'Dusty', hidden: true },
        { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'BaseCharacterPossessionEditController',
        resource: 'possession',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 42 },
        body: { name: 'New Name', description: 'Dusty', hidden: true },
      });
    });

    it('redirects to the possession character-scoped detail page on success', async function() {
      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '7', '5', 42, { name: 'New Name', description: '', hidden: false },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/pcs/7/possessions/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects using the npcs segment for an NPC', async function() {
      const controller = new BaseCharacterPossessionEditController(
        'npcs', setPossession, setLoading, setError, setFieldErrors, client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '9', '3', 42, { name: 'New Name', description: '', hidden: false },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/9/possessions/3');
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

      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', 42, { name: 'X', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );

      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', 42, { name: 'New Name', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', 42, { name: 'New Name', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', 42, { name: 'New Name', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });
  });
});
