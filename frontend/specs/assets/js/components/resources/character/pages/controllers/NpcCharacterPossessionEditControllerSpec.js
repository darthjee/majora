import NpcCharacterPossessionEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterPossessionEditController.js';
import BaseCharacterPossessionEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterPossessionEditController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('NpcCharacterPossessionEditController', function() {
  it('is a BaseCharacterPossessionEditController', function() {
    const controller = new NpcCharacterPossessionEditController(
      jasmine.createSpy('setPossession'),
      jasmine.createSpy('setLoading'),
      jasmine.createSpy('setError'),
    );

    expect(controller).toEqual(jasmine.any(BaseCharacterPossessionEditController));
    expect(controller.characterKind).toBe('npcs');
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and possession id from an NPC possession edit hash', function() {
      expect(NpcCharacterPossessionEditController.getParamsFromHash('#/games/demo/npcs/9/possessions/3/edit'))
        .toEqual({ game_slug: 'demo', character_id: '9', id: '3' });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(NpcCharacterPossessionEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('resolves the NPC-scoped CharacterPossession, then the GamePossession, through RequestStore', async function() {
      const setPossession = jasmine.createSpy('setPossession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
      client.currentHash.and.returnValue('#/games/demo/npcs/9/possessions/3/edit');
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValues(
        Promise.resolve({ data: { id: 3, game_possession_id: 42 } }),
        Promise.resolve({ data: { id: 42, name: 'Old Tavern' } }),
      );

      const cleanup = new NpcCharacterPossessionEditController(
        setPossession, setLoading, setError, undefined, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'BaseCharacterPossessionEditController',
        resource: 'possession',
        quantityType: 'single',
        params: {
          gameSlug: 'demo', kind: 'npcs', id: '9', possessionId: '3',
        },
      });
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'BaseCharacterPossessionEditController',
        resource: 'possession',
        quantityType: 'single',
        params: { gameSlug: 'demo', kind: 'game', id: 42 },
      });
      expect(setPossession).toHaveBeenCalledWith({ id: 42, name: 'Old Tavern', game_possession_id: 42 });

      cleanup();
    });
  });
});
