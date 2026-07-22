import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';

describe('TreasureExchangeModalController', function() {
  describe('#fetchSellPage', function() {
    it('uses the pc client when isPc is true', async function() {
      const { characterClient } = buildClients();
      characterClient.fetchTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }])
      ));
      const controller = new TreasureExchangeModalController(characterClient);

      const result = await controller.fetchSellPage('demo', 7, true, 'tok', { page: 1, perPage: 10 });

      expect(characterClient.fetchTreasuresPage).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { page: 1, perPage: 10 },
      );
      expect(result.data).toEqual([{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }]);
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient } = buildClients();
      characterClient.fetchTreasuresPage.and.returnValue(Promise.resolve(buildResponse(200, [])));
      const controller = new TreasureExchangeModalController(characterClient);

      await controller.fetchSellPage('demo', 7, false, 'tok', { page: 1, perPage: 10 });

      expect(characterClient.fetchTreasuresPage).toHaveBeenCalledWith(
        'npcs', 'demo', 7, 'tok', { page: 1, perPage: 10 },
      );
    });
  });
});
