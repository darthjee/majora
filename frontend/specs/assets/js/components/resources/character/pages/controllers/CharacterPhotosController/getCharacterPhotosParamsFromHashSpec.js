import { KINDS } from './support.js';

KINDS.forEach(({ label, kind, getParamsFromHash }) => {
  describe(label, function() {
    it(`extracts game slug and character id from the ${kind} photos hash`, function() {
      expect(getParamsFromHash(`#/games/demo/${kind}/7/photos`))
        .toEqual({ game_slug: 'demo', character_id: '7' });
    });

    it(`returns empty strings when hash does not match the ${kind} photos route`, function() {
      expect(getParamsFromHash(`#/games/demo/${kind}/7`))
        .toEqual({ game_slug: '', character_id: '' });
    });
  });
});
