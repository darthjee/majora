import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { MAX_PREVIEW_ITEMS }
  from '../../../../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';
import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeDocuments', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches documents through RequestStore and merges them onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));
      const documents = [{ id: 1, game_document_id: 9, name: 'Ancient Tome' }];
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: documents }));

      const result = await controller.fetchAndMergeDocuments({ id: 2 }, params);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'document',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: '2' },
        query: { per_page: MAX_PREVIEW_ITEMS },
      });
      expect(result).toEqual({ id: 2, documents });
    });

    it('degrades to an empty array when the RequestStore.ensure call rejects', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('Network error')));

      const result = await controller.fetchAndMergeDocuments({ id: 2 }, params);

      expect(result).toEqual({ id: 2, documents: [] });
    });

    it('degrades to an empty array when the resolved data is not an array', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { unexpected: 'shape' } }));

      const result = await controller.fetchAndMergeDocuments({ id: 2 }, params);

      expect(result).toEqual({ id: 2, documents: [] });
    });
  });
});
