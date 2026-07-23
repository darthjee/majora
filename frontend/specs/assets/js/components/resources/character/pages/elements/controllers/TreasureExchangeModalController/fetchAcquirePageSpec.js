import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('TreasureExchangeModalController', function() {
  describe('#fetchAcquirePage', function() {
    it('resolves data and pagination through RequestStore (treasure.collection, kind: game)', async function() {
      const pagination = { page: 2, pages: 3, perPage: 5 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Sword', value: 100 }], pagination,
      }));
      const controller = new TreasureExchangeModalController();

      const result = await controller.fetchAcquirePage('demo', {
        page: 2, perPage: 5, maxValue: 500, search: 'sword', ordering: 'desc',
      });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'TreasureExchangeModalController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'game' },
        query: {
          page: 2, per_page: 5, max_value: 500, name: 'sword', ordering: 'desc',
        },
      });
      expect(result).toEqual({
        data: [{ id: 1, name: 'Sword', value: 100 }],
        pagination,
      });
    });

    it('rejects when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new TreasureExchangeModalController();

      await expectAsync(controller.fetchAcquirePage('demo', {})).toBeRejected();
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new TreasureExchangeModalController();

      const result = await controller.fetchAcquirePage('demo', {});

      expect(result.data).toEqual([]);
    });
  });
});
