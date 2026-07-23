import PcCharacterItemEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterItemEditController.js';
import BaseCharacterItemEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('PcCharacterItemEditController', function() {
  it('is a BaseCharacterItemEditController', function() {
    const controller = new PcCharacterItemEditController(
      jasmine.createSpy('setItem'),
      jasmine.createSpy('setLoading'),
      jasmine.createSpy('setError'),
    );

    expect(controller).toEqual(jasmine.any(BaseCharacterItemEditController));
    expect(controller.characterKind).toBe('pcs');
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and item id from a PC item edit hash', function() {
      expect(PcCharacterItemEditController.getParamsFromHash('#/games/demo/pcs/7/items/5/edit')).toEqual({
        game_slug: 'demo', character_id: '7', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(PcCharacterItemEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the PC-scoped item through RequestStore', async function() {
      const setItem = jasmine.createSpy('setItem');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5/edit');
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
        Promise.resolve({ data: { id: 5, name: 'Cloak of Elvenkind' } }),
      );

      const cleanup = new PcCharacterItemEditController(setItem, setLoading, setError, undefined, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'BaseCharacterItemEditController',
        resource: 'item',
        quantityType: 'single',
        params: { gameSlug: 'demo', kind: 'pcs', id: '7', itemId: '5' },
      });
      expect(setItem).toHaveBeenCalledWith({ id: 5, name: 'Cloak of Elvenkind' });

      cleanup();
    });
  });
});
