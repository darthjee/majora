import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeDocuments', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges documents onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'), {
        fetchCharacterDocuments: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, game_document_id: 9, name: 'Ancient Tome' }]),
        }),
      });

      const result = await controller.fetchAndMergeDocuments({ id: 2 }, params, 'tok');

      expect(controller.fetchCharacterDocuments).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(result).toEqual({ id: 2, documents: [{ id: 1, game_document_id: 9, name: 'Ancient Tome' }] });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body is not an array', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ unexpected: 'shape' }),
      })],
    ];

    degradedCases.forEach(([description, fetchCharacterDocuments]) => {
      it(`degrades to an empty array when the ${description}`, async function() {
        const controller = buildController(jasmine.createSpy('setCharacter'), { fetchCharacterDocuments });

        const result = await controller.fetchAndMergeDocuments({ id: 2 }, params, 'tok');

        expect(result).toEqual({ id: 2, documents: [] });
      });
    });
  });
});
