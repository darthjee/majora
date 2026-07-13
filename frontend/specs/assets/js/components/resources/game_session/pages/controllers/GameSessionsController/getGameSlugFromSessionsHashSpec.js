import GameSessionsController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js';

describe('GameSessionsController', function() {
  it('extracts game slug from sessions hash', function() {
    expect(GameSessionsController.getGameSlugFromSessionsHash('#/games/demo/sessions')).toBe('demo');
  });

  it('returns empty string when hash does not match sessions route', function() {
    expect(GameSessionsController.getGameSlugFromSessionsHash('#/games/demo')).toBe('');
  });
});
