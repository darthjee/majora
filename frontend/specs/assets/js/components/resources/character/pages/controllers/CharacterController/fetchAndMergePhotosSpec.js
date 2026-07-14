import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergePhotos', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges photos onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'), {
        fetchCharacterPhotos: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, path: '/photo.png' }]),
        }),
      });

      const result = await controller.fetchAndMergePhotos({ id: 2 }, params, 'tok');

      expect(controller.fetchCharacterPhotos).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(result).toEqual({ id: 2, photos: [{ id: 1, path: '/photo.png' }] });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body is not an array', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ unexpected: 'shape' }),
      })],
    ];

    degradedCases.forEach(([description, fetchCharacterPhotos]) => {
      it(`degrades to an empty array when the ${description}`, async function() {
        const controller = buildController(jasmine.createSpy('setCharacter'), { fetchCharacterPhotos });

        const result = await controller.fetchAndMergePhotos({ id: 2 }, params, 'tok');

        expect(result).toEqual({ id: 2, photos: [] });
      });
    });
  });
});
