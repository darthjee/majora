import BaseCharacterItemEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('BaseCharacterItemEditController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let setStatus;
  let client;

  afterEach(function() {
    AuthStorage.clearToken();
  });

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    setStatus = jasmine.createSpy('setStatus');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    client.patchJson.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 5, name: 'New Name' }),
    }));
  });

  describe('#submitForm', function() {
    it('prevents default, resets status/errors, and PATCHes the fields payload for a PC', async function() {
      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event, 'demo', '7', '5', { name: 'New Name', description: 'Shiny', hidden: true }, { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(client.patchJson).toHaveBeenCalledWith(
        '/games/demo/pcs/7/items/5.json',
        'tok-abc',
        { name: 'New Name', description: 'Shiny', hidden: true },
      );
    });

    it('PATCHes the npcs-scoped path for an NPC', async function() {
      const controller = new BaseCharacterItemEditController(
        'npcs', setItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '9', '3', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(client.patchJson).toHaveBeenCalledWith(
        '/games/demo/npcs/9/items/3.json',
        'tok-abc',
        { name: 'New Name', description: '', hidden: false },
      );
    });

    it('redirects to the item detail page on success', async function() {
      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '7', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/pcs/7/items/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      client.patchJson.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', { name: 'X', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      client.patchJson.and.returnValue(Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }));

      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      client.patchJson.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined, 'demo', '7', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });
  });
});
