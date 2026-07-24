import GameDocumentNewController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js';

describe('GameDocumentNewController', function() {
  describe('.getGameSlugFromDocumentNewHash', function() {
    it('extracts the game slug from a document new hash', function() {
      expect(GameDocumentNewController.getGameSlugFromDocumentNewHash('#/games/demo/documents/new')).toBe('demo');
    });

    it('returns an empty string when the hash does not match the new route', function() {
      expect(GameDocumentNewController.getGameSlugFromDocumentNewHash('#/games/demo/documents')).toBe('');
    });
  });
});
