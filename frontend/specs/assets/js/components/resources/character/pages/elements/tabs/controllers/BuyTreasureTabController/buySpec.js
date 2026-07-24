import BuyTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('BuyTreasureTabController', function() {
  describe('#buy', function() {
    it('returns ok with the new quantity, money, and acquired on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 4, money: 100, acquired: 2 })),
      );
      const controller = new BuyTreasureTabController();

      const result = await controller.buy('demo', 7, true, { treasureId: 9, quantity: 2 });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'BuyTreasureTabController',
        resource: 'treasure',
        method: 'POST',
        quantityType: 'buy',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { treasure_id: 9, quantity: 2 },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true, quantity: 4, money: 100, acquired: 2 });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(200, { quantity: 1, money: 10 })));
      const controller = new BuyTreasureTabController();

      await controller.buy('demo', 7, false, { treasureId: 9, quantity: 1 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('maps the insufficient funds error message to its translation key', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['insufficient funds'] } })),
      );
      const controller = new BuyTreasureTabController();

      const result = await controller.buy('demo', 7, true, { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.insufficient_funds' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['something else'] } })),
      );
      const controller = new BuyTreasureTabController();

      const result = await controller.buy('demo', 7, true, { treasureId: 9, quantity: 1 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.generic_error' });
    });

    it('passes the private variant when canEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 3, money: 50, acquired: 3 })),
      );
      const controller = new BuyTreasureTabController();

      const result = await controller.buy('demo', 7, true, { treasureId: 9, quantity: 3 }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
      expect(result).toEqual({ ok: true, quantity: 3, money: 50, acquired: 3 });
    });

    it('passes the regular variant when canEdit is omitted', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 10, acquired: 1 })),
      );
      const controller = new BuyTreasureTabController();

      await controller.buy('demo', 7, true, { treasureId: 9, quantity: 1 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
