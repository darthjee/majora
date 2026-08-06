import GiveTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GiveTreasureModalController', function() {
  describe('#fetchSummary', function() {
    it('fetches the treasure summary through RequestStore with the given params', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { quantity: 3 } }));
      const controller = new GiveTreasureModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'treasure',
        quantityType: 'summary',
        params: {
          gameSlug: 'demo', treasureId: 9, kind: 'pcs', id: 3,
        },
      }));
      expect(result).toBe(3);
    });

    it('defaults the quantity to 0 when missing from the response', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      const controller = new GiveTreasureModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(result).toBe(0);
    });
  });
});
