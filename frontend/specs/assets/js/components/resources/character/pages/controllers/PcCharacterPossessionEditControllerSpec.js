import PcCharacterPossessionEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterPossessionEditController.js';
import BaseCharacterPossessionEditController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterPossessionEditController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('PcCharacterPossessionEditController', function() {
  it('is a BaseCharacterPossessionEditController', function() {
    const controller = new PcCharacterPossessionEditController(
      jasmine.createSpy('setPossession'),
      jasmine.createSpy('setLoading'),
      jasmine.createSpy('setError'),
    );

    expect(controller).toEqual(jasmine.any(BaseCharacterPossessionEditController));
    expect(controller.characterKind).toBe('pcs');
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and possession id from a PC possession edit hash', function() {
      expect(PcCharacterPossessionEditController.getParamsFromHash('#/games/demo/pcs/7/possessions/5/edit'))
        .toEqual({ game_slug: 'demo', character_id: '7', id: '5' });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(PcCharacterPossessionEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('resolves the PC-scoped CharacterPossession, then the GamePossession, through RequestStore', async function() {
      const setPossession = jasmine.createSpy('setPossession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5/edit');
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValues(
        Promise.resolve({ data: { id: 5, game_possession_id: 42 } }),
        Promise.resolve({ data: { id: 42, name: 'Old Tavern' } }),
      );

      const cleanup = new PcCharacterPossessionEditController(setPossession, setLoading, setError, undefined, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'BaseCharacterPossessionEditController',
        resource: 'possession',
        quantityType: 'single',
        params: {
          gameSlug: 'demo', kind: 'pcs', id: '7', possessionId: '5',
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
