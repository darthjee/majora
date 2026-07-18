import CharacterListsController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterListsController.js';

const buildFakeCharacterClient = () => ({
  fetchCharacterTreasures: jasmine.createSpy('fetchCharacterTreasures').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
  fetchCharacterItems: jasmine.createSpy('fetchCharacterItems').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
  fetchCharacterPhotos: jasmine.createSpy('fetchCharacterPhotos').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
});

describe('CharacterListsController', function() {
  describe('#fetchCharacterTreasures', function() {
    it('delegates to the character client with the character kind', function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'npcs');

      controller.fetchCharacterTreasures('demo', '2', 'tok');

      expect(characterClient.fetchCharacterTreasures).toHaveBeenCalledWith('npcs', 'demo', '2', 'tok');
    });
  });

  describe('#fetchCharacterItems', function() {
    it('delegates to the character client with the character kind', function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');

      controller.fetchCharacterItems('demo', '2', 'tok');

      expect(characterClient.fetchCharacterItems).toHaveBeenCalledWith('pcs', 'demo', '2', 'tok');
    });
  });

  describe('#fetchCharacterPhotos', function() {
    it('delegates to the character client with the character kind', function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');

      controller.fetchCharacterPhotos('demo', '2', 'tok');

      expect(characterClient.fetchCharacterPhotos).toHaveBeenCalledWith('pcs', 'demo', '2', 'tok');
    });
  });

  describe('#fetchAndMergeItems', function() {
    it('merges items onto the character on success', async function() {
      const characterClient = buildFakeCharacterClient();
      characterClient.fetchCharacterItems.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([{ id: 1, name: 'Cloak of Elvenkind' }]),
      }));
      const controller = new CharacterListsController(characterClient, 'pcs');

      const result = await controller.fetchAndMergeItems(
        { id: 2 }, { game_slug: 'demo', character_id: '2' }, 'tok',
      );

      expect(result).toEqual({ id: 2, items: [{ id: 1, name: 'Cloak of Elvenkind' }] });
    });
  });
});
