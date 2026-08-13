import CharacterPossessionDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionDetailController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('CharacterPossessionDetailController', function() {
  let setPossession;
  let setLoading;
  let setError;
  let setCanEdit;
  let setCanUploadPhoto;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setPossession = jasmine.createSpy('setPossession');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanEdit = jasmine.createSpy('setCanEdit');
    setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 1, game_possession_id: 5, name: 'Old Tavern' } }),
    );
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and possession id for pcs', function() {
      expect(CharacterPossessionDetailController.getParamsFromHash('pcs', '#/games/demo/pcs/7/possessions/5'))
        .toEqual({ game_slug: 'demo', character_id: '7', id: '5' });
    });

    it('extracts the game slug, character id, and possession id for npcs', function() {
      expect(CharacterPossessionDetailController.getParamsFromHash('npcs', '#/games/demo/npcs/9/possessions/3'))
        .toEqual({ game_slug: 'demo', character_id: '9', id: '3' });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(CharacterPossessionDetailController.getParamsFromHash('pcs', '#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    [
      ['pcs', '#/games/demo/pcs/7/possessions/5', { gameSlug: 'demo', kind: 'pcs', id: '7', possessionId: '5' }],
      ['npcs', '#/games/demo/npcs/9/possessions/3', { gameSlug: 'demo', kind: 'npcs', id: '9', possessionId: '3' }],
    ].forEach(([characterKind, hash, expectedParams]) => {
      describe(`for ${characterKind}`, function() {
        beforeEach(function() {
          client.currentHash.and.returnValue(hash);
        });

        it('fetches the possession through RequestStore with the character-owned kind', async function() {
          const cleanup = new CharacterPossessionDetailController(
            characterKind, setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(ensureSpy).toHaveBeenCalledWith({
            componentName: 'CharacterPossessionDetailController',
            resource: 'possession',
            quantityType: 'single',
            params: expectedParams,
          });
          expect(setPossession).toHaveBeenCalledWith({ id: 1, game_possession_id: 5, name: 'Old Tavern' });
          expect(setLoading).toHaveBeenCalledWith(false);
          expect(setError).not.toHaveBeenCalled();

          cleanup();
        });

        it('resolves game-level canEdit/canUploadPhoto independently of the character kind', async function() {
          const cleanup = new CharacterPossessionDetailController(
            characterKind, setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith(expectedParams.gameSlug);
          expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith(expectedParams.gameSlug);

          cleanup();
        });
      });
    });

    it('sets an error when the fetch rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5');
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new CharacterPossessionDetailController(
        'pcs', setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7');

      const cleanup = new CharacterPossessionDetailController(
        'pcs', setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
      ).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5');

      const cleanup = new CharacterPossessionDetailController(
        'pcs', setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPossession).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('canUploadPhoto', function() {
    beforeEach(function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5');
    });

    const runController = async () => {
      const cleanup = new CharacterPossessionDetailController(
        'pcs', setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('is true for a player (game-level access, not character-level)', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_player: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is false for an unrelated authenticated user', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({
        is_superuser: false, is_staff: false, is_dm: false, is_player: false,
      }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the access check rejects', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });
  });

  describe('canEdit', function() {
    beforeEach(function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/possessions/5');
    });

    const runController = async () => {
      const cleanup = new CharacterPossessionDetailController(
        'pcs', setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('is true when the requester can edit the game', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: true }));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(true);
    });

    it('is false when the requester cannot edit the game', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: false }));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the permissions check rejects', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(false);
    });
  });
});
