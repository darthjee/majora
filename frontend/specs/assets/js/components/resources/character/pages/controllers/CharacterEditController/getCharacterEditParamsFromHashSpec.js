import { KINDS } from './support.js';

KINDS.forEach(({ label, kind, getParamsFromHash }) => {
  describe(label, function() {
    it('extracts character params from an edit hash', function() {
      expect(getParamsFromHash(`#/games/demo/${kind}/1/edit`)).toEqual({
        game_slug: 'demo',
        character_id: '1',
      });
    });
  });
});
