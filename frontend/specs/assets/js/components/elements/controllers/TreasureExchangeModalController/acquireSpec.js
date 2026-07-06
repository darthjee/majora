import TreasureExchangeModalController
  from '../../../../../../../assets/js/components/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';

describe('TreasureExchangeModalController', function() {
  describe('#acquire', function() {
    it('returns ok with the new quantity and money on success', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquirePcTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 4, money: 100 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 2 });

      expect(characterClient.acquirePcTreasure).toHaveBeenCalledWith(
        'demo', 7, 'tok', { treasure_id: 9, quantity: 2 }
      );
      expect(result).toEqual({ ok: true, quantity: 4, money: 100 });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireNpcTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 10 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.acquire('demo', 7, false, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.acquireNpcTreasure).toHaveBeenCalledWith(
        'demo', 7, 'tok', { treasure_id: 9, quantity: 1 }
      );
    });

    it('maps the insufficient funds error message to its translation key', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquirePcTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['insufficient funds'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.insufficient_funds' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquirePcTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['something else'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 1 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.generic_error' });
    });
  });
});
