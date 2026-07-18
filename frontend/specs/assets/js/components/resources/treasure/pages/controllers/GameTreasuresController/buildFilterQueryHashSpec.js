import GameTreasuresController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js';

describe('GameTreasuresController', function() {
  describe('.buildFilterQueryHash', function() {
    it('resets pagination to page 1 when no filters are active', function() {
      expect(GameTreasuresController.buildFilterQueryHash('#/games/demo/treasures', {}))
        .toBe('#/games/demo/treasures?page=1');
    });

    it('includes the active min_value/max_value/name filters alongside the reset page', function() {
      expect(
        GameTreasuresController.buildFilterQueryHash('#/games/demo/treasures', {
          min_value: '10', max_value: '100', name: 'sword',
        })
      ).toBe('#/games/demo/treasures?page=1&min_value=10&max_value=100&name=sword');
    });

    it('includes only the given filter when a single one is active', function() {
      expect(GameTreasuresController.buildFilterQueryHash('#/games/demo/treasures', { name: 'sword' }))
        .toBe('#/games/demo/treasures?page=1&name=sword');
    });
  });
});
