import { getGameSlugFromNpcsHash }
  from '../../../../../../../assets/js/components/pages/controllers/GameNpcsController.js';

describe('GameNpcsController', function() {
  it('extracts game slug from npcs hash', function() {
    expect(getGameSlugFromNpcsHash('#/games/demo/npcs')).toBe('demo');
  });
});
