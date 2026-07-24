import SellTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/SellTreasureTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('SellTreasureTabController', function() {
  describe('#sell', function() {
    it('returns ok with the new quantity and money on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(200, { quantity: 0, money: 600 })));
      const controller = new SellTreasureTabController();

      const result = await controller.sell('demo', 7, true, { treasureId: 9, quantity: 1 });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'SellTreasureTabController',
        resource: 'treasure',
        method: 'POST',
        quantityType: 'sell',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { treasure_id: 9, quantity: 1 },
      });
      expect(result).toEqual({ ok: true, quantity: 0, money: 600 });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(200, { quantity: 0, money: 10 })));
      const controller = new SellTreasureTabController();

      await controller.sell('demo', 7, false, { treasureId: 9, quantity: 1 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('maps the not enough owned error message to its translation key', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['not enough owned'] } })),
      );
      const controller = new SellTreasureTabController();

      const result = await controller.sell('demo', 7, true, { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.not_enough_owned' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['something else'] } })),
      );
      const controller = new SellTreasureTabController();

      const result = await controller.sell('demo', 7, true, { treasureId: 9, quantity: 1 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.generic_error' });
    });
  });
});
