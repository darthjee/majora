import GameNpcsController
  from '../../../../../../../assets/js/components/pages/controllers/GameNpcsController.js';

describe('GameNpcsController', function() {
  it('extracts game slug from npcs hash', function() {
    expect(GameNpcsController.getGameSlugFromNpcsHash('#/games/demo/npcs')).toBe('demo');
  });
});
