import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller }) => {
  describe(label, function() {
    describe('.buildFilterQueryHash', function() {
      it('resets pagination to page 1 when no filters are active', function() {
        expect(Controller.buildFilterQueryHash('#/games/demo/pcs/2/treasures', {}))
          .toBe('#/games/demo/pcs/2/treasures?page=1');
      });

      it('includes the active min_value/max_value/name filters alongside the reset page', function() {
        expect(
          Controller.buildFilterQueryHash('#/games/demo/pcs/2/treasures', {
            min_value: '10', max_value: '100', name: 'sword',
          })
        ).toBe('#/games/demo/pcs/2/treasures?page=1&min_value=10&max_value=100&name=sword');
      });

      it('includes only the given filter when a single one is active', function() {
        expect(Controller.buildFilterQueryHash('#/games/demo/pcs/2/treasures', { name: 'sword' }))
          .toBe('#/games/demo/pcs/2/treasures?page=1&name=sword');
      });
    });
  });
});
