import BuyTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController.js';
import { buildClients, buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('BuyTreasureTabController', function() {
  describe('#confirmBuy', function() {
    const character = buildCharacter({
      id: 7, game_slug: 'demo', is_pc: true, money: 500,
    });
    const selected = {
      id: 9, name: 'Ring', value: 50, photo_path: '/ring.png',
    };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setSelected: jasmine.createSpy('setSelected'),
      setPartialNotice: jasmine.createSpy('setPartialNotice'),
      setActionError: jasmine.createSpy('setActionError'),
      onSuccess: jasmine.createSpy('onSuccess'),
      reload: jasmine.createSpy('reload'),
    });

    it('sets submitting true before the request settles', function() {
      const { characterClient } = buildClients();
      // eslint-disable-next-line no-empty-function
      characterClient.buyTreasure.and.returnValue(new Promise(() => {}));
      const controller = new BuyTreasureTabController(characterClient);
      const setters = buildSetters();

      controller.confirmBuy(selected, 2, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('buys the selected treasure id', async function() {
      const { characterClient } = buildClients();
      characterClient.buyTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 2, money: 400, acquired: 2 }))
      );
      const controller = new BuyTreasureTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmBuy(selected, 2, character, setters);

      expect(characterClient.buyTreasure).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { treasure_id: 9, quantity: 2 },
      );
    });

    it('applies the success outcome: clears selection, notifies onSuccess, and reloads', async function() {
      const { characterClient } = buildClients();
      characterClient.buyTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 3, money: 350, acquired: 2 }))
      );
      const controller = new BuyTreasureTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmBuy(selected, 3, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setSelected).toHaveBeenCalledWith(null);
      expect(setters.setPartialNotice).toHaveBeenCalledWith('Only 2 of 3 were available and were acquired.');
      expect(setters.onSuccess).toHaveBeenCalledWith({
        treasureId: 9,
        treasureInfo: { name: 'Ring', value: 50, photo_path: '/ring.png' },
        quantity: 3,
        money: 350,
        acquired: 2,
      });
      expect(setters.reload).toHaveBeenCalled();
    });

    it('surfaces the error key and does not reload on a validation failure', async function() {
      const { characterClient } = buildClients();
      characterClient.buyTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['insufficient funds'] } }))
      );
      const controller = new BuyTreasureTabController(characterClient);
      const setters = buildSetters();

      await controller.confirmBuy(selected, 100, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('treasure_exchange_modal.insufficient_funds');
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character canEdit flag through to the buy request', async function() {
      const { characterClient } = buildClients();
      characterClient.buyTreasureAll.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 400, acquired: 1 }))
      );
      const controller = new BuyTreasureTabController(characterClient);
      const setters = buildSetters();
      const editorCharacter = { ...character, canEdit: true };

      await controller.confirmBuy(selected, 1, editorCharacter, setters);

      expect(characterClient.buyTreasureAll).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { treasure_id: 9, quantity: 1 },
      );
    });
  });
});
