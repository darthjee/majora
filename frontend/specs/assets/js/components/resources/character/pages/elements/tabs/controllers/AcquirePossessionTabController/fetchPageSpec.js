import AcquirePossessionTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquirePossessionTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('AcquirePossessionTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (possession.availableCollection)', async function() {
      const pagination = { page: 2, pages: 3, perPage: 5 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Old Tavern' }], pagination,
      }));
      const controller = new AcquirePossessionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, { page: 2, perPage: 5, search: 'tavern' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'AcquirePossessionTabController',
        resource: 'possession',
        quantityType: 'availableCollection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 2, per_page: 5, name: 'tavern' },
      });
      expect(result).toEqual({ data: [{ id: 1, name: 'Old Tavern' }], pagination });
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new AcquirePossessionTabController();

      await expectAsync(controller.fetchPage('demo', 'pcs', 7, {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new AcquirePossessionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, {});

      expect(result.data).toEqual([]);
    });
  });
});
