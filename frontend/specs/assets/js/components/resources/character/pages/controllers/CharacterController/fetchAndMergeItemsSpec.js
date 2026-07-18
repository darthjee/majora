import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeItems', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges items onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'), {
        fetchCharacterItems: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, game_item_id: 9, name: 'Cloak of Elvenkind' }]),
        }),
      });

      const result = await controller.fetchAndMergeItems({ id: 2 }, params, 'tok');

      expect(controller.fetchCharacterItems).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(result).toEqual({ id: 2, items: [{ id: 1, game_item_id: 9, name: 'Cloak of Elvenkind' }] });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body is not an array', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ unexpected: 'shape' }),
      })],
    ];

    degradedCases.forEach(([description, fetchCharacterItems]) => {
      it(`degrades to an empty array when the ${description}`, async function() {
        const controller = buildController(jasmine.createSpy('setCharacter'), { fetchCharacterItems });

        const result = await controller.fetchAndMergeItems({ id: 2 }, params, 'tok');

        expect(result).toEqual({ id: 2, items: [] });
      });
    });
  });
});
