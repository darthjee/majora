import GiveItemModalController
  from '../../../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('GiveItemModalController', function() {
  describe('#acquire', function() {
    it('submits an acquire request with the given item id, hidden flag, and variant', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true)));
      const controller = new GiveItemModalController();

      await controller.acquire('demo', 3, 'pcs', 9, true, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'item',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 3 },
        body: { game_item_id: 9, hidden: true },
        variantName: 'private',
      }));
    });

    it('uses the regular variant when canGiveHidden is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true)));
      const controller = new GiveItemModalController();

      await controller.acquire('demo', 3, 'pcs', 9, false, false);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });

    it('resolves to true on a successful response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true)));
      const controller = new GiveItemModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, false, false)).toBe(true);
    });

    it('resolves to false on a failed response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(false)));
      const controller = new GiveItemModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, false, false)).toBe(false);
    });

    it('resolves to false instead of rejecting on a network failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network down')));
      const controller = new GiveItemModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, false, false)).toBe(false);
    });
  });
});
