import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeTreasures', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges treasures onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'), {
        fetchCharacterTreasures: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: 'Sword', quantity: 1 }]),
        }),
      });

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, params, 'tok');

      expect(controller.fetchCharacterTreasures).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(result).toEqual({ id: 2, treasures: [{ id: 1, name: 'Sword', quantity: 1 }] });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body is not an array', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ unexpected: 'shape' }),
      })],
    ];

    degradedCases.forEach(([description, fetchCharacterTreasures]) => {
      it(`degrades to an empty array when the ${description}`, async function() {
        const controller = buildController(jasmine.createSpy('setCharacter'), { fetchCharacterTreasures });

        const result = await controller.fetchAndMergeTreasures({ id: 2 }, params, 'tok');

        expect(result).toEqual({ id: 2, treasures: [] });
      });
    });
  });
});
