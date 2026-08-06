import GiveDocumentModalController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController.js';

describe('GiveDocumentModalController', function() {
  describe('.removeCharacter', function() {
    it('removes the matching row from the receiving list', function() {
      const rowA = { character: { id: 1 }, kind: 'pcs', owned: false, result: null };
      const rowB = { character: { id: 2 }, kind: 'npcs', owned: false, result: null };

      expect(GiveDocumentModalController.removeCharacter([rowA, rowB], 'pcs', 1)).toEqual([rowB]);
    });

    it('does not remove a row of a different kind sharing the same id', function() {
      const rowA = { character: { id: 1 }, kind: 'pcs', owned: false, result: null };
      const rowB = { character: { id: 1 }, kind: 'npcs', owned: false, result: null };

      expect(GiveDocumentModalController.removeCharacter([rowA, rowB], 'pcs', 1)).toEqual([rowB]);
    });
  });
});
