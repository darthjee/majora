import AcquireItemTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController.js';
import { buildClients, buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('AcquireItemTabController', function() {
  describe('#confirmAcquire', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 9, name: 'Ring', photo_path: '/ring.png', hidden: false };

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
      characterClient.acquireItem.and.returnValue(new Promise(() => {}));
      const controller = new AcquireItemTabController(characterClient);
      const setters = buildSetters();

      controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('acquires the selected game item id with the given hidden value', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItem.and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquireItemTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmAcquire(selected, true, character, setters);

      expect(characterClient.acquireItem).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { game_item_id: 9, hidden: true },
      );
    });

    it('applies the success outcome: clears selection, notifies onSuccess, and reloads', async function() {
      const { characterClient } = buildClients();
      const characterItem = { id: 3, game_item_id: 9, name: 'Ring', hidden: false };
      characterClient.acquireItem.and.returnValue(Promise.resolve(buildResponse(201, characterItem)));
      const controller = new AcquireItemTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setSelected).toHaveBeenCalledWith(null);
      expect(setters.onSuccess).toHaveBeenCalledWith({ gameItemId: 9, characterItem });
      expect(setters.reload).toHaveBeenCalled();
    });

    it('surfaces the error key and does not reload on a validation failure', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItem.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { game_item_id: ['already owned'] } }))
      );
      const controller = new AcquireItemTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('item_exchange_modal.already_owned_error');
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character gameCanEdit flag through to the acquire request', async function() {
      const { characterClient } = buildClients();
      characterClient.acquireItemAll.and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquireItemTabController(characterClient);
      const setters = buildSetters();
      const editorCharacter = { ...character, gameCanEdit: true };

      await controller.confirmAcquire(selected, true, editorCharacter, setters);

      expect(characterClient.acquireItemAll).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { game_item_id: 9, hidden: true },
      );
    });
  });
});
