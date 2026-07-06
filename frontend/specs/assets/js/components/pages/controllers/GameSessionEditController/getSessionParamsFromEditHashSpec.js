import GameSessionEditController
  from '../../../../../../../assets/js/components/pages/controllers/GameSessionEditController.js';

describe('GameSessionEditController', function() {
  it('extracts game slug and id from an edit hash', function() {
    expect(GameSessionEditController.getSessionParamsFromEditHash('#/games/demo/sessions/7/edit')).toEqual({
      game_slug: 'demo',
      id: '7',
    });
  });

  it('returns empty strings when the hash does not match the edit route', function() {
    expect(GameSessionEditController.getSessionParamsFromEditHash('#/games/demo/sessions/7')).toEqual({ game_slug: '', id: '' });
  });
});
