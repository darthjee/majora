import AcquireItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('AcquireItemTabController', function() {
  describe('#acquire', function() {
    it('returns ok with the acquired CharacterItem on success', async function() {
      const characterItem = {
        id: 3, game_item_id: 9, name: 'Ring', photo_path: null, description: '', hidden: false,
      };
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, characterItem)));
      const controller = new AcquireItemTabController();

      const result = await controller.acquire('demo', 7, true, { gameItemId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'AcquireItemTabController',
        resource: 'item',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { game_item_id: 9, hidden: false },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true, characterItem });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireItemTabController();

      await controller.acquire('demo', 7, false, { gameItemId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('returns the already-owned error key when the game item is already owned', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { game_item_id: ['already owned'] } })),
      );
      const controller = new AcquireItemTabController();

      const result = await controller.acquire('demo', 7, true, { gameItemId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'item_exchange_modal.already_owned_error' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { game_item_id: ['something else'] } })),
      );
      const controller = new AcquireItemTabController();

      const result = await controller.acquire('demo', 7, true, { gameItemId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'item_exchange_modal.generic_error' });
    });

    it('passes the private variant when gameCanEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireItemTabController();

      await controller.acquire('demo', 7, true, { gameItemId: 9, hidden: true }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });

    it('passes the regular variant when gameCanEdit is omitted', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireItemTabController();

      await controller.acquire('demo', 7, true, { gameItemId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
