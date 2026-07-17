import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';

describe('TreasureExchangeModalController', function() {
  describe('#fetchAcquirePage', function() {
    it('resolves data and pagination from the treasure client response', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, name: 'Sword', value: 100 }], { page: '2', pages: '3', per_page: '5' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.fetchAcquirePage('demo', 'tok', { page: 2, perPage: 5, maxValue: 500 });

      expect(treasureClient.fetchGameTreasuresPage).toHaveBeenCalledWith(
        'demo', 'tok', { page: 2, perPage: 5, maxValue: 500 }
      );
      expect(result).toEqual({
        data: [{ id: 1, name: 'Sword', value: 100 }],
        pagination: { page: 2, pages: 3, perPage: 5 },
      });
    });

    it('rejects when the response is not ok', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(buildResponse(500, {})));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await expectAsync(controller.fetchAcquirePage('demo', 'tok', {})).toBeRejected();
    });

    it('uses the treasures/all endpoint when canEdit is true', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresAllPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, name: 'Hidden Sword', value: 100, hidden: true }],
          { page: '1', pages: '1', per_page: '10' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.fetchAcquirePage('demo', 'tok', { page: 1, perPage: 10 }, true);

      expect(treasureClient.fetchGameTreasuresAllPage).toHaveBeenCalledWith(
        'demo', 'tok', { page: 1, perPage: 10 }
      );
      expect(treasureClient.fetchGameTreasuresPage).not.toHaveBeenCalled();
      expect(result).toEqual({
        data: [{ id: 1, name: 'Hidden Sword', value: 100, hidden: true }],
        pagination: { page: 1, pages: 1, perPage: 10 },
      });
    });

    it('uses the regular endpoint when canEdit is omitted', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [], { page: '1', pages: '1', per_page: '10' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.fetchAcquirePage('demo', 'tok', {});

      expect(treasureClient.fetchGameTreasuresPage).toHaveBeenCalledWith('demo', 'tok', {});
      expect(treasureClient.fetchGameTreasuresAllPage).not.toHaveBeenCalled();
    });
  });
});
