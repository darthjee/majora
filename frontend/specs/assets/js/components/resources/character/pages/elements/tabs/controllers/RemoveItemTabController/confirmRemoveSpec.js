import RemoveItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController.js';
import { buildClients, buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('RemoveItemTabController', function() {
  describe('#confirmRemove', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 3, game_item_id: 11, name: 'Ring', photo_path: '/ring.png' };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setSelected: jasmine.createSpy('setSelected'),
      setActionError: jasmine.createSpy('setActionError'),
      onSuccess: jasmine.createSpy('onSuccess'),
      reload: jasmine.createSpy('reload'),
    });

    it('sets submitting true before the request settles', function() {
      const { characterClient } = buildClients();
      // eslint-disable-next-line no-empty-function
      characterClient.removeItem.and.returnValue(new Promise(() => {}));
      const controller = new RemoveItemTabController(characterClient);
      const setters = buildSetters();

      controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('removes the selected owned item\'s game_item_id', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(characterClient.removeItem).toHaveBeenCalledWith('pcs', 'demo', 7, null, { game_item_id: 11 });
    });

    it('applies the success outcome: clears selection, notifies onSuccess, and reloads', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setSelected).toHaveBeenCalledWith(null);
      expect(setters.onSuccess).toHaveBeenCalledWith({ gameItemId: 11 });
      expect(setters.reload).toHaveBeenCalled();
    });

    it('surfaces the error key and does not reload on a failure', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItem.and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemoveItemTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('item_exchange_modal.generic_error');
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character canEdit flag through to the remove request', async function() {
      const { characterClient } = buildClients();
      characterClient.removeItemAll.and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveItemTabController(characterClient);
      const setters = buildSetters();
      const editorCharacter = { ...character, canEdit: true };

      await controller.confirmRemove(selected, editorCharacter, setters);

      expect(characterClient.removeItemAll).toHaveBeenCalledWith('pcs', 'demo', 7, null, { game_item_id: 11 });
    });
  });
});
