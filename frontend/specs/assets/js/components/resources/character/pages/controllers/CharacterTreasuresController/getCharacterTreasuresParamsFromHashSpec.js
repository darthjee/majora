import { KINDS } from './support.js';

KINDS.forEach(({ label, kind, getParamsFromHash }) => {
  describe(label, function() {
    it('extracts game slug and character id from treasures hash', function() {
      expect(getParamsFromHash(`#/games/demo/${kind}/2/treasures`)).toEqual({
        game_slug: 'demo',
        character_id: '2',
      });
    });

    it('returns empty strings when hash does not match the treasures route', function() {
      expect(getParamsFromHash(`#/games/demo/${kind}/2`)).toEqual({
        game_slug: '',
        character_id: '',
      });
    });
  });
});
