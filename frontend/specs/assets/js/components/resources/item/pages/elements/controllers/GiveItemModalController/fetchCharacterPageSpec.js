import GiveItemModalController
  from '../../../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GiveItemModalController', function() {
  describe('#fetchCharacterPage', function() {
    it('fetches the pc collection with the given search/pagination params', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Aria' }], pagination: { page: 1, pages: 2 },
      }));
      const controller = new GiveItemModalController();

      await controller.fetchCharacterPage('demo', 'pcs', { page: 1, perPage: 10, search: 'ar' });

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'pc',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        query: { page: 1, per_page: 10, name: 'ar' },
      }));
    });

    it('fetches the npc collection when kind is npcs', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [], pagination: { page: 1, pages: 1 } }));
      const controller = new GiveItemModalController();

      await controller.fetchCharacterPage('demo', 'npcs', { page: 1, perPage: 10, search: '' });

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({ resource: 'npc' }));
    });

    it('defaults data to an empty array when the response data is not an array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: null, pagination: { page: 1, pages: 1 } }));
      const controller = new GiveItemModalController();

      const result = await controller.fetchCharacterPage('demo', 'pcs', { page: 1, perPage: 10, search: '' });

      expect(result.data).toEqual([]);
    });
  });
});
