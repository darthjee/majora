import RemoveItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('RemoveItemTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (item.collection, kind: pcs)', async function() {
      const pagination = { page: 1, pages: 2, perPage: 10 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, game_item_id: 9, name: 'Ring' }], pagination,
      }));
      const controller = new RemoveItemTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, { page: 1, perPage: 10, search: 'ring' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'RemoveItemTabController',
        resource: 'item',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 1, per_page: 10, name: 'ring' },
      });
      expect(result).toEqual({ data: [{ id: 1, game_item_id: 9, name: 'Ring' }], pagination });
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new RemoveItemTabController();

      await expectAsync(controller.fetchPage('demo', 'pcs', 7, {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemoveItemTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, {});

      expect(result.data).toEqual([]);
    });
  });
});
