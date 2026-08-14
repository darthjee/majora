import RecruitModalController
  from '../../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/RecruitModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('RecruitModalController', function() {
  describe('#fetchSummary', function() {
    it('fetches the faction summary through RequestStore with the given params', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { enlisted: true } }));
      const controller = new RecruitModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'faction',
        quantityType: 'summary',
        params: {
          gameSlug: 'demo', factionId: 9, kind: 'pcs', id: 3,
        },
      }));
      expect(result).toBe(true);
    });

    it('defaults enlisted to false when missing from the response', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      const controller = new RecruitModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(result).toBe(false);
    });
  });
});
