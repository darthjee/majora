import CharacterListsController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterListsController.js';

const buildFakeCharacterClient = () => ({
  fetchCharacterPhotos: jasmine.createSpy('fetchCharacterPhotos').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
});

describe('CharacterListsController', function() {
  describe('#fetchCharacterPhotos', function() {
    it('delegates to the character client with the character kind', function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');

      controller.fetchCharacterPhotos('demo', '2', 'tok');

      expect(characterClient.fetchCharacterPhotos).toHaveBeenCalledWith('pcs', 'demo', '2', 'tok');
    });
  });

  describe('#fetchAndMergePhotos', function() {
    it('merges the resolved photos onto the character', async function() {
      const characterClient = buildFakeCharacterClient();
      characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([{ id: 1, path: '/photo.png' }]),
      }));
      const controller = new CharacterListsController(characterClient, 'pcs');

      const result = await controller.fetchAndMergePhotos({ id: 2 }, { game_slug: 'demo', character_id: '2' }, 'tok');

      expect(result).toEqual({ id: 2, photos: [{ id: 1, path: '/photo.png' }] });
    });
  });

  // `fetchAndMergeTreasures`/`fetchAndMergeItems`/`fetchAndMergeDocuments` were removed from
  // this controller (issue #856) — the treasures/items/documents preview lists are now fetched
  // independently by the `ShortList` element itself, through `RequestStore`, driven by
  // `shortListResourceConfig`. See `ShortListControllerSpec.js`/`shortListResourceConfigSpec.js`.
});
