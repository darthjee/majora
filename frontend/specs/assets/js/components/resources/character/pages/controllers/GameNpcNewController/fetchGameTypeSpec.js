import GameNpcNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';

describe('GameNpcNewController', function() {
  describe('#fetchGameType', function() {
    it('resolves the game_type from the game fetch response', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ game_slug: 'demo', game_type: 'deadlands' }),
      }));
      const controller = new GameNpcNewController(null, null, null, null, null, gameClient);

      const gameType = await controller.fetchGameType('demo', 'tok');

      expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', 'tok');
      expect(gameType).toBe('deadlands');
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('network error'))],
      ['response body has no game_type', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ game_slug: 'demo' }),
      })],
    ];

    degradedCases.forEach(([description, fetchGame]) => {
      it(`degrades to 'dnd' when the ${description}`, async function() {
        const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
        gameClient.fetchGame.and.callFake(fetchGame);
        const controller = new GameNpcNewController(null, null, null, null, null, gameClient);

        const gameType = await controller.fetchGameType('demo', 'tok');

        expect(gameType).toBe('dnd');
      });
    });
  });
});
