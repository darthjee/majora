import RemovePossessionTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemovePossessionTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('RemovePossessionTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (possession.collection, kind: pcs)', async function() {
      const pagination = { page: 1, pages: 2, perPage: 10 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, game_possession_id: 9, name: 'Old Tavern' }], pagination,
      }));
      const controller = new RemovePossessionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, { page: 1, perPage: 10, search: 'tavern' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'RemovePossessionTabController',
        resource: 'possession',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 1, per_page: 10, name: 'tavern' },
      });
      expect(result).toEqual({ data: [{ id: 1, game_possession_id: 9, name: 'Old Tavern' }], pagination });
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new RemovePossessionTabController();

      await expectAsync(controller.fetchPage('demo', 'pcs', 7, {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemovePossessionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, {});

      expect(result.data).toEqual([]);
    });
  });
});
