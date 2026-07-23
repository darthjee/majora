import RemoveTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveTreasureTabController.js';
import { buildClients, buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('RemoveTreasureTabController', function() {
  describe('#confirmRemove', function() {
    const character = buildCharacter({
      id: 7, game_slug: 'demo', is_pc: true,
    });
    const selected = {
      id: 3, treasure_id: 11, name: 'Ring', value: 50, photo_path: '/ring.png', quantity: 3,
    };

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
      characterClient.removeTreasure.and.returnValue(new Promise(() => {}));
      const controller = new RemoveTreasureTabController(characterClient);
      const setters = buildSetters();

      controller.confirmRemove(selected, 1, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('removes the selected owned treasure id', async function() {
      const { characterClient } = buildClients();
      characterClient.removeTreasure.and.returnValue(Promise.resolve(buildResponse(200, { quantity: 2, money: 600 })));
      const controller = new RemoveTreasureTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmRemove(selected, 1, character, setters);

      expect(characterClient.removeTreasure).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { treasure_id: 11, quantity: 1 },
      );
    });

    it('applies the success outcome: clears selection, notifies onSuccess, and reloads', async function() {
      const { characterClient } = buildClients();
      characterClient.removeTreasure.and.returnValue(Promise.resolve(buildResponse(200, { quantity: 2, money: 600 })));
      const controller = new RemoveTreasureTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmRemove(selected, 1, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setSelected).toHaveBeenCalledWith(null);
      expect(setters.onSuccess).toHaveBeenCalledWith({
        treasureId: 11,
        treasureInfo: { name: 'Ring', value: 50, photo_path: '/ring.png' },
        quantity: 2,
        money: 600,
        acquired: undefined,
      });
      expect(setters.reload).toHaveBeenCalled();
    });

    it('surfaces the error key and does not reload on a validation failure', async function() {
      const { characterClient } = buildClients();
      characterClient.removeTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['not enough owned'] } }))
      );
      const controller = new RemoveTreasureTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmRemove(selected, 100, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('treasure_exchange_modal.not_enough_owned');
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });
  });
});
