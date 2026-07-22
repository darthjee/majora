import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';

describe('TreasureExchangeModalController', function() {
  describe('#sell', function() {
    it('returns ok with the new quantity and money on success', async function() {
      const { characterClient } = buildClients();
      characterClient.sellTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 0, money: 600 }))
      );
      const controller = new TreasureExchangeModalController(characterClient);

      const result = await controller.sell('demo', 7, true, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.sellTreasure).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 1 },
      );
      expect(result).toEqual({
        ok: true, quantity: 0, money: 600, acquired: undefined,
      });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient } = buildClients();
      characterClient.sellTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 0, money: 10 }))
      );
      const controller = new TreasureExchangeModalController(characterClient);

      await controller.sell('demo', 7, false, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.sellTreasure).toHaveBeenCalledWith(
        'npcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 1 },
      );
    });

    it('maps the not enough owned error message to its translation key', async function() {
      const { characterClient } = buildClients();
      characterClient.sellTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['not enough owned'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient);

      const result = await controller.sell('demo', 7, true, 'tok', { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.not_enough_owned' });
    });
  });
});
