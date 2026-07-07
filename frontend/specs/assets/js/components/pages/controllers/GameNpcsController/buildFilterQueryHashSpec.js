import GameNpcsController
  from '../../../../../../../assets/js/components/pages/controllers/GameNpcsController.js';

describe('GameNpcsController', function() {
  describe('.buildFilterQueryHash', function() {
    it('resets pagination to page 1 when no filters are active', function() {
      expect(GameNpcsController.buildFilterQueryHash('#/games/demo/npcs', {}))
        .toBe('#/games/demo/npcs?page=1');
    });

    it('includes the active slain/name filters alongside the reset page', function() {
      expect(
        GameNpcsController.buildFilterQueryHash('#/games/demo/npcs', { slain: 'true', name: 'gob' })
      ).toBe('#/games/demo/npcs?page=1&slain=true&name=gob');
    });

    it('includes only the given filter when a single one is active', function() {
      expect(GameNpcsController.buildFilterQueryHash('#/games/demo/npcs', { name: 'gob' }))
        .toBe('#/games/demo/npcs?page=1&name=gob');
    });
  });
});
