import NpcCharacterItemEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterItemEditController.js';
import BaseCharacterItemEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';

describe('NpcCharacterItemEditController', function() {
  it('is a BaseCharacterItemEditController', function() {
    const controller = new NpcCharacterItemEditController(
      jasmine.createSpy('setItem'),
      jasmine.createSpy('setLoading'),
      jasmine.createSpy('setError'),
    );

    expect(controller).toEqual(jasmine.any(BaseCharacterItemEditController));
    expect(controller.characterKind).toBe('npcs');
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and item id from an NPC item edit hash', function() {
      expect(NpcCharacterItemEditController.getParamsFromHash('#/games/demo/npcs/9/items/3/edit')).toEqual({
        game_slug: 'demo', character_id: '9', id: '3',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(NpcCharacterItemEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the NPC-scoped elevated endpoint', async function() {
      const setItem = jasmine.createSpy('setItem');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
      client.currentHash.and.returnValue('#/games/demo/npcs/9/items/3/edit');
      client.fetch.and.returnValue(Promise.resolve({ id: 3, name: 'Cloak of Elvenkind' }));

      const cleanup = new NpcCharacterItemEditController(setItem, setLoading, setError, undefined, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetch).toHaveBeenCalledWith('/games/demo/npcs/9/items/3/full.json');
      expect(setItem).toHaveBeenCalledWith({ id: 3, name: 'Cloak of Elvenkind' });

      cleanup();
    });
  });
});
