import PlayerSlainConfirmController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/PlayerSlainConfirmController.js';
import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('PlayerSlainConfirmController', function() {
  let onSuccess;

  beforeEach(function() {
    onSuccess = jasmine.createSpy('onSuccess');
  });

  describe('#handleConfirm', function() {
    it('mutates with the flipped slain value when the character is alive', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new PlayerSlainConfirmController(onSuccess);
      const character = { id: 7, slain: false };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'PlayerSlainConfirmController',
        resource: 'npc',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 7 },
        body: { slain: true },
        variantName: 'regular',
      });
    });

    it('mutates with the flipped slain value when the character is slain', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new PlayerSlainConfirmController(onSuccess);
      const character = { id: 7, slain: true };

      await controller.handleConfirm('demo', character, 'auth-token');

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { slain: false },
      }));
    });

    it('purges the npc cache and invokes onSuccess once the request resolves successfully', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      );
      const controller = new PlayerSlainConfirmController(onSuccess);

      await controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token');

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'npc' });
      expect(onSuccess).toHaveBeenCalled();
    });

    it('does not purge nor invoke onSuccess on a failed response', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) }),
      );
      const controller = new PlayerSlainConfirmController(onSuccess);

      await controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token');

      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('does not invoke onSuccess when the request rejects', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network error')));
      const controller = new PlayerSlainConfirmController(onSuccess);

      await expectAsync(
        controller.handleConfirm('demo', { id: 7, slain: false }, 'auth-token'),
      ).toBeRejected();

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
