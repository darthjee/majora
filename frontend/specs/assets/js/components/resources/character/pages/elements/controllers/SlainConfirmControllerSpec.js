import SlainConfirmController from '../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/SlainConfirmController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('SlainConfirmController', function() {
  let onSuccess;

  beforeEach(function() {
    onSuccess = jasmine.createSpy('onSuccess');
  });

  describe('#handleConfirm', function() {
    it('defaults to toggling the private_slain field when no field is given', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess);
      const character = { id: 7, private_slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'SlainConfirmController',
        resource: 'npc',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 7 },
        body: { private_slain: true },
        variantName: 'private',
      });
    });

    it('mutates with the flipped slain value when the character is alive', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess, 'private_slain');
      const character = { id: 7, private_slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { private_slain: true },
      }));
    });

    it('mutates with the flipped slain value when the character is slain', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess, 'private_slain');
      const character = { id: 7, private_slain: true };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { private_slain: false },
      }));
    });

    it('mutates with the flipped public_slain value when toggling the public field', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess, 'public_slain');
      const character = { id: 7, private_slain: false, public_slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { public_slain: true },
      }));
    });

    it('does not touch the private_slain value when toggling the public field', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess, 'public_slain');
      const character = { id: 7, private_slain: true, public_slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      const [{ body }] = RequestStore.mutate.calls.mostRecent().args;
      expect(body.private_slain).toBeUndefined();
    });

    it('purges the npc cache and invokes onSuccess once the request resolves successfully', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess, 'private_slain');

      await controller.handleConfirm('demo', { id: 7, private_slain: false }, 'auth-token');

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'npc' });
      expect(onSuccess).toHaveBeenCalled();
    });

    it('does not purge nor invoke onSuccess on a failed response', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) }),
      );
      const controller = new SlainConfirmController(onSuccess, 'private_slain');

      await controller.handleConfirm('demo', { id: 7, private_slain: false }, 'auth-token');

      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
