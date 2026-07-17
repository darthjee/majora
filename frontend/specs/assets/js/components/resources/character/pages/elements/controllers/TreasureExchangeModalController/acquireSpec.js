import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';

describe('TreasureExchangeModalController', function() {
  describe('#acquire', function() {
    it('returns ok with the new quantity and money on success', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 4, money: 100, acquired: 2 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 2 });

      expect(characterClient.acquireTreasure).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 2 }
      );
      expect(result).toEqual({
        ok: true, quantity: 4, money: 100, acquired: 2,
      });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 10 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.acquire('demo', 7, false, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.acquireTreasure).toHaveBeenCalledWith(
        'npcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 1 }
      );
    });

    it('maps the insufficient funds error message to its translation key', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['insufficient funds'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.insufficient_funds' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['something else'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 1 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.generic_error' });
    });

    it('uses the acquire/all endpoint for a PC when canEdit is true', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasureAll.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 3, money: 50, acquired: 3 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 3 }, true);

      expect(characterClient.acquireTreasureAll).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 3 }
      );
      expect(characterClient.acquireTreasure).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true, quantity: 3, money: 50, acquired: 3 });
    });

    it('uses the acquire/all endpoint for an NPC when canEdit is true', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasureAll.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 10, acquired: 1 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.acquire('demo', 7, false, 'tok', { treasureId: 9, quantity: 1 }, true);

      expect(characterClient.acquireTreasureAll).toHaveBeenCalledWith(
        'npcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 1 }
      );
    });

    it('uses the regular acquire endpoint when canEdit is omitted', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 10, acquired: 1 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.acquireTreasure).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { treasure_id: 9, quantity: 1 }
      );
      expect(characterClient.acquireTreasureAll).not.toHaveBeenCalled();
    });
  });
});
