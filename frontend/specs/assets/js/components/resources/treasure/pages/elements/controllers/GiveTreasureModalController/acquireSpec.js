import GiveTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('GiveTreasureModalController', function() {
  describe('#acquire', function() {
    it('submits an acquire request with the given treasure id, quantity, and variant', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true, 2)));
      const controller = new GiveTreasureModalController();

      await controller.acquire('demo', 3, 'pcs', 9, 2, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'treasure',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 3 },
        body: { treasure_id: 9, quantity: 2 },
        variantName: 'private',
      }));
    });

    it('uses the regular variant when canGiveHidden is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true, 1)));
      const controller = new GiveTreasureModalController();

      await controller.acquire('demo', 3, 'pcs', 9, 1, false);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });

    it('resolves to ok:true with the acquired amount on a successful response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true, 2)));
      const controller = new GiveTreasureModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, 3, false)).toEqual({ ok: true, acquired: 2 });
    });

    it('resolves to ok:false on a failed response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(false)));
      const controller = new GiveTreasureModalController();

      expect((await controller.acquire('demo', 3, 'pcs', 9, 1, false)).ok).toBe(false);
    });

    it('resolves to ok:false, acquired:0 instead of rejecting on a network failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network down')));
      const controller = new GiveTreasureModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, 1, false)).toEqual({ ok: false, acquired: 0 });
    });
  });
});
