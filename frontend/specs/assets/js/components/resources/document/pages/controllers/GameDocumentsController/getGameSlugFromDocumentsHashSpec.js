import GameDocumentsController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentsController.js';

describe('GameDocumentsController', function() {
  describe('.getGameSlugFromDocumentsHash', function() {
    it('extracts the game slug from a documents index hash', function() {
      expect(GameDocumentsController.getGameSlugFromDocumentsHash('#/games/demo/documents')).toBe('demo');
    });

    it('defaults to an empty string for a non-matching hash', function() {
      expect(GameDocumentsController.getGameSlugFromDocumentsHash('#/games/demo')).toBe('');
    });
  });
});
