import GiveItemModalController
  from '../../../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GiveItemModalController', function() {
  describe('#fetchSummary', function() {
    it('fetches the item summary through RequestStore with the given params', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { quantity: 3 } }));
      const controller = new GiveItemModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'item',
        quantityType: 'summary',
        params: {
          gameSlug: 'demo', itemId: 9, kind: 'pcs', id: 3,
        },
      }));
      expect(result).toBe(3);
    });

    it('defaults the quantity to 0 when missing from the response', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      const controller = new GiveItemModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(result).toBe(0);
    });
  });
});
