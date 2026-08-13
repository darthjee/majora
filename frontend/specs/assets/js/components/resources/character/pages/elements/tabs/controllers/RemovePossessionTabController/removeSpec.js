import RemovePossessionTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemovePossessionTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('RemovePossessionTabController', function() {
  describe('#remove', function() {
    it('returns ok on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemovePossessionTabController();

      const result = await controller.remove('demo', 7, true, { gamePossessionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'RemovePossessionTabController',
        resource: 'possession',
        method: 'POST',
        quantityType: 'remove',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { game_possession_id: 9 },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemovePossessionTabController();

      await controller.remove('demo', 7, false, { gamePossessionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('returns a generic error on failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemovePossessionTabController();

      const result = await controller.remove('demo', 7, true, { gamePossessionId: 9 });

      expect(result).toEqual({ ok: false, errorKey: 'possession_exchange_modal.generic_error' });
    });

    it('passes the private variant when canEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemovePossessionTabController();

      await controller.remove('demo', 7, true, { gamePossessionId: 9 }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });

    it('passes the regular variant when canEdit is omitted', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemovePossessionTabController();

      await controller.remove('demo', 7, true, { gamePossessionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
