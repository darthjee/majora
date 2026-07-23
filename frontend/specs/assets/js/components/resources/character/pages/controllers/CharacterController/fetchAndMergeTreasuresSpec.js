import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { MAX_PREVIEW_ITEMS }
  from '../../../../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';
import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeTreasures', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches treasures through RequestStore and merges them onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));
      const treasures = [{ id: 1, name: 'Sword', quantity: 1 }];
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: treasures }));

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, params);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: '2' },
        query: { per_page: MAX_PREVIEW_ITEMS },
      });
      expect(result).toEqual({ id: 2, treasures });
    });

    it('degrades to an empty array when the RequestStore.ensure call rejects', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('Network error')));

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, params);

      expect(result).toEqual({ id: 2, treasures: [] });
    });

    it('degrades to an empty array when the resolved data is not an array', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));

      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { unexpected: 'shape' } }));

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, params);

      expect(result).toEqual({ id: 2, treasures: [] });
    });
  });
});
