import CharacterListsController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterListsController.js';
import RequestStore
  from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { MAX_PREVIEW_ITEMS }
  from '../../../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';

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

  describe('#fetchAndMergeTreasures', function() {
    it('fetches treasures through RequestStore and merges them onto the character on success', async function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'npcs');
      const treasures = [{ id: 1, name: 'Ring of Protection' }];
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: treasures }));

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, { game_slug: 'demo', character_id: '2' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'npcs', id: '2' },
        query: { per_page: MAX_PREVIEW_ITEMS },
      });
      expect(result).toEqual({ id: 2, treasures });
    });

    it('degrades to an empty treasures list on failure', async function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, { game_slug: 'demo', character_id: '2' });

      expect(result).toEqual({ id: 2, treasures: [] });
    });
  });

  describe('#fetchAndMergeItems', function() {
    it('fetches items through RequestStore and merges them onto the character on success', async function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');
      const items = [{ id: 1, name: 'Cloak of Elvenkind' }];
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: items }));

      const result = await controller.fetchAndMergeItems({ id: 2 }, { game_slug: 'demo', character_id: '2' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'item',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: '2' },
        query: { per_page: MAX_PREVIEW_ITEMS },
      });
      expect(result).toEqual({ id: 2, items });
    });

    it('degrades to an empty items list on failure', async function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));

      const result = await controller.fetchAndMergeItems({ id: 2 }, { game_slug: 'demo', character_id: '2' });

      expect(result).toEqual({ id: 2, items: [] });
    });
  });

  describe('#fetchAndMergeDocuments', function() {
    it('fetches documents through RequestStore and merges them onto the character on success', async function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');
      const documents = [{ id: 1, name: 'Ancient Tome' }];
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: documents }));

      const result = await controller.fetchAndMergeDocuments({ id: 2 }, { game_slug: 'demo', character_id: '2' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'document',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: '2' },
        query: { per_page: MAX_PREVIEW_ITEMS },
      });
      expect(result).toEqual({ id: 2, documents });
    });

    it('degrades to an empty documents list on failure', async function() {
      const characterClient = buildFakeCharacterClient();
      const controller = new CharacterListsController(characterClient, 'pcs');

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));

      const result = await controller.fetchAndMergeDocuments({ id: 2 }, { game_slug: 'demo', character_id: '2' });

      expect(result).toEqual({ id: 2, documents: [] });
    });
  });
});
