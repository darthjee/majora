import { getGameSlugFromNpcNewHash }
  from '../../../../../../../assets/js/components/pages/controllers/GameNpcNewController.js';

describe('GameNpcNewController', function() {
  it('extracts game slug from an NPC new hash', function() {
    expect(getGameSlugFromNpcNewHash('#/games/demo/npcs/new')).toBe('demo');
  });

  it('returns empty string when the hash does not match the new route', function() {
    expect(getGameSlugFromNpcNewHash('#/games/demo/npcs')).toBe('');
  });
});
