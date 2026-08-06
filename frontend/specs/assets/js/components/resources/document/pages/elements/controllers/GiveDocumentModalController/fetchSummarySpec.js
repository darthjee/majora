import GiveDocumentModalController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GiveDocumentModalController', function() {
  describe('#fetchSummary', function() {
    it('fetches the document summary through RequestStore with the given params', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { owned: true } }));
      const controller = new GiveDocumentModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'document',
        quantityType: 'summary',
        params: {
          gameSlug: 'demo', documentId: 9, kind: 'pcs', id: 3,
        },
      }));
      expect(result).toBe(true);
    });

    it('defaults owned to false when missing from the response', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      const controller = new GiveDocumentModalController();

      const result = await controller.fetchSummary('demo', 9, 'pcs', 3);

      expect(result).toBe(false);
    });
  });
});
