import BaseCharacterPossessionEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterPossessionEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('BaseCharacterPossessionEditController', function() {
  let setPossession;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setPossession = jasmine.createSpy('setPossession');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValues(
      Promise.resolve({ data: { id: 5, game_possession_id: 42 } }),
      Promise.resolve({ data: { id: 42, name: 'Old Tavern', description: 'Dusty', hidden: false } }),
    );
  });

  describe('#buildEffect', function() {
    [
      [
        'pcs', '#/games/demo/pcs/7/possessions/5/edit',
        { characterPossession: { gameSlug: 'demo', kind: 'pcs', id: '7', possessionId: '5' }, gamePossessionId: 42 },
      ],
      [
        'npcs', '#/games/demo/npcs/9/possessions/3/edit',
        { characterPossession: { gameSlug: 'demo', kind: 'npcs', id: '9', possessionId: '3' }, gamePossessionId: 42 },
      ],
    ].forEach(([characterKind, hash, expected]) => {
      describe(`for ${characterKind}`, function() {
        beforeEach(function() {
          client.currentHash.and.returnValue(hash);
        });

        it('resolves the CharacterPossession, then the GamePossession, through RequestStore', async function() {
          const cleanup = new BaseCharacterPossessionEditController(
            characterKind, setPossession, setLoading, setError, setFieldErrors, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(ensureSpy).toHaveBeenCalledWith({
            componentName: 'BaseCharacterPossessionEditController',
            resource: 'possession',
            quantityType: 'single',
            params: expected.characterPossession,
          });
          expect(ensureSpy).toHaveBeenCalledWith({
            componentName: 'BaseCharacterPossessionEditController',
            resource: 'possession',
            quantityType: 'single',
            params: { gameSlug: 'demo', kind: 'game', id: expected.gamePossessionId },
          });
          expect(setPossession).toHaveBeenCalledWith({
            id: 42, name: 'Old Tavern', description: 'Dusty', hidden: false, game_possession_id: 42,
          });
          expect(setLoading).toHaveBeenCalledWith(false);
          expect(setError).not.toHaveBeenCalled();

          cleanup();
        });
      });
    });

    it('sets an error when resolving the CharacterPossession rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5/edit');
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when loading the underlying GamePossession rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5/edit');
      ensureSpy.and.returnValues(
        Promise.resolve({ data: { id: 5, game_possession_id: 42 } }),
        Promise.reject(new Error('network error')),
      );

      const cleanup = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7');

      const cleanup = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5/edit');

      const cleanup = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPossession).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
