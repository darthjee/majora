import GameNpcNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';

describe('GameNpcNewController', function() {
  it('extracts game slug from an NPC new hash', function() {
    expect(GameNpcNewController.getGameSlugFromNpcNewHash('#/games/demo/npcs/new')).toBe('demo');
  });

  it('returns empty string when the hash does not match the new route', function() {
    expect(GameNpcNewController.getGameSlugFromNpcNewHash('#/games/demo/npcs')).toBe('');
  });
});
