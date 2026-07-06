import TreasureExchangeModalController
  from '../../../../../../../assets/js/components/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';

describe('TreasureExchangeModalController', function() {
  describe('#fetchSellPage', function() {
    it('uses the pc client when isPc is true', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.fetchPcTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }])
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.fetchSellPage('demo', 7, true, 'tok', { page: 1, perPage: 10 });

      expect(characterClient.fetchPcTreasuresPage).toHaveBeenCalledWith('demo', 7, 'tok', { page: 1, perPage: 10 });
      expect(result.data).toEqual([{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }]);
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.fetchNpcTreasuresPage.and.returnValue(Promise.resolve(buildResponse(200, [])));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.fetchSellPage('demo', 7, false, 'tok', { page: 1, perPage: 10 });

      expect(characterClient.fetchNpcTreasuresPage).toHaveBeenCalledWith('demo', 7, 'tok', { page: 1, perPage: 10 });
    });
  });
});
