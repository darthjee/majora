import TreasureEditController
  from '../../../../../../../assets/js/components/pages/controllers/TreasureEditController.js';

describe('TreasureEditController', function() {
  it('extracts treasure id from an edit hash', function() {
    expect(TreasureEditController.getTreasureIdFromEditHash('#/treasures/42/edit')).toBe('42');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(TreasureEditController.getTreasureIdFromEditHash('#/treasures/42')).toBe('');
  });
});
