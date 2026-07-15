import CharacterGameTypeResolver
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterGameTypeResolver.js';

describe('CharacterGameTypeResolver', function() {
  describe('.merge', function() {
    it('merges game_type onto the character on success', async function() {
      const gameFetch = Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ game_slug: 'demo', game_type: 'deadlands' }),
      });

      const result = await CharacterGameTypeResolver.merge({ id: 2 }, gameFetch);

      expect(result).toEqual({ id: 2, game_type: 'deadlands' });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body has no game_type', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ game_slug: 'demo' }),
      })],
    ];

    degradedCases.forEach(([description, buildGameFetch]) => {
      it(`degrades to 'dnd' when the ${description}`, async function() {
        const result = await CharacterGameTypeResolver.merge({ id: 2 }, buildGameFetch());

        expect(result).toEqual({ id: 2, game_type: 'dnd' });
      });
    });
  });
});
