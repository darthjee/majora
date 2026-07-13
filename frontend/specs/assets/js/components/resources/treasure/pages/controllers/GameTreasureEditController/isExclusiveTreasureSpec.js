import GameTreasureEditController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureEditController.js';

describe('GameTreasureEditController', function() {
  describe('.isExclusiveTreasure', function() {
    it('returns true when the treasure has a game_slug', function() {
      expect(GameTreasureEditController.isExclusiveTreasure({ game_slug: 'demo' })).toBeTrue();
    });

    it('returns false when the treasure game_slug is null', function() {
      expect(GameTreasureEditController.isExclusiveTreasure({ game_slug: null })).toBeFalse();
    });

    it('returns false when the treasure game_slug is undefined', function() {
      expect(GameTreasureEditController.isExclusiveTreasure({ name: 'Sword' })).toBeFalse();
    });

    it('returns false when the treasure is null', function() {
      expect(GameTreasureEditController.isExclusiveTreasure(null)).toBeFalse();
    });
  });
});
