import RemoveItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController.js';
import { buildClients, buildResponse } from './support.js';

describe('RemoveItemTabController', function() {
  describe('#remove', function() {
    it('returns ok on success', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);

      const result = await controller.remove('demo', 7, true, 'tok', { gameItemId: 9 });

      expect(characterClient.removeItem).toHaveBeenCalledWith('pcs', 'demo', 7, 'tok', { game_item_id: 9 });
      expect(result).toEqual({ ok: true });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);

      await controller.remove('demo', 7, false, 'tok', { gameItemId: 9 });

      expect(characterClient.removeItem).toHaveBeenCalledWith('npcs', 'demo', 7, 'tok', { game_item_id: 9 });
    });

    it('returns a generic error on failure', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemoveItemTabController(characterClient);

      const result = await controller.remove('demo', 7, true, 'tok', { gameItemId: 9 });

      expect(result).toEqual({ ok: false, errorKey: 'item_exchange_modal.generic_error' });
    });

    it('uses the remove/all endpoint when canEdit is true', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItemAll.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);

      await controller.remove('demo', 7, true, 'tok', { gameItemId: 9 }, true);

      expect(characterClient.removeItemAll).toHaveBeenCalledWith('pcs', 'demo', 7, 'tok', { game_item_id: 9 });
      expect(characterClient.removeItem).not.toHaveBeenCalled();
    });

    it('uses the regular remove endpoint when canEdit is omitted', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);

      await controller.remove('demo', 7, true, 'tok', { gameItemId: 9 });

      expect(characterClient.removeItem).toHaveBeenCalled();
      expect(characterClient.removeItemAll).not.toHaveBeenCalled();
    });
  });
});
