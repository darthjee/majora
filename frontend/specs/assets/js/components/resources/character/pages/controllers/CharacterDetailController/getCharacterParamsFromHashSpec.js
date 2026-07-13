import { KINDS } from './support.js';

KINDS.forEach(({ label, kind, getParamsFromHash }) => {
  describe(label, function() {
    it('extracts character params from hash', function() {
      expect(getParamsFromHash(`#/games/demo/${kind}/1`)).toEqual({
        game_slug: 'demo',
        character_id: '1',
      });
    });
  });
});
