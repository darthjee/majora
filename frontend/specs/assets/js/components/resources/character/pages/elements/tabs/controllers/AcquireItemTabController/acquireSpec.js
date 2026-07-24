import AcquireItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController.js';
import { buildClients, buildResponse } from './support.js';

describe('AcquireItemTabController', function() {
  describe('#acquire', function() {
    it('returns ok with the acquired CharacterItem on success', async function() {
      const { characterClient } = buildClients();
      const characterItem = {
        id: 3, game_item_id: 9, name: 'Ring', photo_path: null, description: '', hidden: false,
      };
      characterClient.acquireItem.and.returnValue(Promise.resolve(buildResponse(201, characterItem)));
      const controller = new AcquireItemTabController(characterClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { gameItemId: 9, hidden: false });

      expect(characterClient.acquireItem).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { game_item_id: 9, hidden: false }
      );
      expect(result).toEqual({ ok: true, characterItem });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItem.and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireItemTabController(characterClient);

      await controller.acquire('demo', 7, false, 'tok', { gameItemId: 9, hidden: false });

      expect(characterClient.acquireItem).toHaveBeenCalledWith(
        'npcs', 'demo', 7, 'tok', { game_item_id: 9, hidden: false }
      );
    });

    it('returns the already-owned error key when the game item is already owned', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItem.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { game_item_id: ['already owned'] } }))
      );
      const controller = new AcquireItemTabController(characterClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { gameItemId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'item_exchange_modal.already_owned_error' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItem.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { game_item_id: ['something else'] } }))
      );
      const controller = new AcquireItemTabController(characterClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { gameItemId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'item_exchange_modal.generic_error' });
    });

    it('uses the acquire/all endpoint when gameCanEdit is true', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItemAll.and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireItemTabController(characterClient);

      await controller.acquire('demo', 7, true, 'tok', { gameItemId: 9, hidden: true }, true);

      expect(characterClient.acquireItemAll).toHaveBeenCalledWith(
        'pcs', 'demo', 7, 'tok', { game_item_id: 9, hidden: true }
      );
      expect(characterClient.acquireItem).not.toHaveBeenCalled();
    });

    it('uses the regular acquire endpoint when gameCanEdit is omitted', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItem.and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireItemTabController(characterClient);

      await controller.acquire('demo', 7, true, 'tok', { gameItemId: 9, hidden: false });

      expect(characterClient.acquireItem).toHaveBeenCalled();
      expect(characterClient.acquireItemAll).not.toHaveBeenCalled();
    });
  });
});
