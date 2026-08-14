import RecruitModalController
  from '../../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/RecruitModalController.js';

describe('RecruitModalController', function() {
  describe('.removeCharacter', function() {
    it('removes the matching row from the receiving list', function() {
      const rowA = { character: { id: 1 }, kind: 'pcs', enlisted: false, result: null };
      const rowB = { character: { id: 2 }, kind: 'npcs', enlisted: false, result: null };

      expect(RecruitModalController.removeCharacter([rowA, rowB], 'pcs', 1)).toEqual([rowB]);
    });

    it('does not remove a row of a different kind sharing the same id', function() {
      const rowA = { character: { id: 1 }, kind: 'pcs', enlisted: false, result: null };
      const rowB = { character: { id: 1 }, kind: 'npcs', enlisted: false, result: null };

      expect(RecruitModalController.removeCharacter([rowA, rowB], 'pcs', 1)).toEqual([rowB]);
    });
  });
});
