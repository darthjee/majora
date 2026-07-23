import AcquireTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('AcquireTreasureTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (treasure.collection, kind: game)', async function() {
      const pagination = { page: 2, pages: 3, perPage: 5 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Sword', value: 100 }], pagination,
      }));
      const controller = new AcquireTreasureTabController();

      const result = await controller.fetchPage('demo', {
        page: 2, perPage: 5, search: 'sword', ordering: 'desc',
      });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'AcquireTreasureTabController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'game' },
        query: {
          page: 2, per_page: 5, name: 'sword', ordering: 'desc',
        },
      });
      expect(result).toEqual({ data: [{ id: 1, name: 'Sword', value: 100 }], pagination });
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new AcquireTreasureTabController();

      await expectAsync(controller.fetchPage('demo', {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new AcquireTreasureTabController();

      const result = await controller.fetchPage('demo', {});

      expect(result.data).toEqual([]);
    });
  });
});
