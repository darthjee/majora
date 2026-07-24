import AcquireItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('AcquireItemTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (item.availableCollection)', async function() {
      const pagination = { page: 2, pages: 3, perPage: 5 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Sword' }], pagination,
      }));
      const controller = new AcquireItemTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, { page: 2, perPage: 5, search: 'sword' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'AcquireItemTabController',
        resource: 'item',
        quantityType: 'availableCollection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 2, per_page: 5, name: 'sword' },
      });
      expect(result).toEqual({ data: [{ id: 1, name: 'Sword' }], pagination });
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new AcquireItemTabController();

      await expectAsync(controller.fetchPage('demo', 'pcs', 7, {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new AcquireItemTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, {});

      expect(result.data).toEqual([]);
    });
  });
});
