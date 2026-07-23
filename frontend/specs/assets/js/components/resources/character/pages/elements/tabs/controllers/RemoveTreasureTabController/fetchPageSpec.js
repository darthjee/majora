import RemoveTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveTreasureTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('RemoveTreasureTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (treasure.ownedCollection, kind: pcs)', async function() {
      const pagination = { page: 1, pages: 2, perPage: 10 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }], pagination,
      }));
      const controller = new RemoveTreasureTabController();

      const result = await controller.fetchPage('demo', 7, true, { page: 1, perPage: 10, search: 'ring' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'RemoveTreasureTabController',
        resource: 'treasure',
        quantityType: 'ownedCollection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 1, per_page: 10, name: 'ring' },
      });
      expect(result).toEqual({
        data: [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }], pagination,
      });
    });

    it('resolves the npcs kind when isPc is false', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemoveTreasureTabController();

      await controller.fetchPage('demo', 7, false, { page: 1, perPage: 10, search: '' });

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new RemoveTreasureTabController();

      await expectAsync(controller.fetchPage('demo', 7, true, {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemoveTreasureTabController();

      const result = await controller.fetchPage('demo', 7, true, {});

      expect(result.data).toEqual([]);
    });
  });
});
