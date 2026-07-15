import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeGameType', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges game_type onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'), {
        fetchGame: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ game_slug: 'demo', game_type: 'deadlands' }),
        }),
      });

      const result = await controller.fetchAndMergeGameType({ id: 2 }, params, 'tok');

      expect(controller.fetchGame).toHaveBeenCalledWith('demo', 'tok');
      expect(result).toEqual({ id: 2, game_type: 'deadlands' });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body has no game_type', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ game_slug: 'demo' }),
      })],
    ];

    degradedCases.forEach(([description, fetchGame]) => {
      it(`degrades to 'dnd' when the ${description}`, async function() {
        const controller = buildController(jasmine.createSpy('setCharacter'), { fetchGame });

        const result = await controller.fetchAndMergeGameType({ id: 2 }, params, 'tok');

        expect(result).toEqual({ id: 2, game_type: 'dnd' });
      });
    });
  });
});
