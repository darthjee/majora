import RecruitModalController
  from '../../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/RecruitModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('RecruitModalController', function() {
  describe('#acquire', function() {
    it('submits an acquire request with the given faction id and variant', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true)));
      const controller = new RecruitModalController();

      await controller.acquire('demo', 3, 'pcs', 9, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'faction',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 3 },
        body: { game_faction_id: 9, hidden: false },
        variantName: 'private',
      }));
    });

    it('uses the regular variant when canRecruitHidden is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true)));
      const controller = new RecruitModalController();

      await controller.acquire('demo', 3, 'pcs', 9, false);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });

    it('resolves to true on a successful response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(true)));
      const controller = new RecruitModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, false)).toBe(true);
    });

    it('resolves to false on a failed response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(false)));
      const controller = new RecruitModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, false)).toBe(false);
    });

    it('resolves to false instead of rejecting on a network failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network down')));
      const controller = new RecruitModalController();

      expect(await controller.acquire('demo', 3, 'pcs', 9, false)).toBe(false);
    });
  });
});
