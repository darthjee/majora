import CharacterDocumentDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterDocumentDetailController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('CharacterDocumentDetailController', function() {
  let setDocument;
  let setLoading;
  let setError;
  let setCanEditPages;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setDocument = jasmine.createSpy('setDocument');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanEditPages = jasmine.createSpy('setCanEditPages');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 1, name: 'Ancient Tome' } }),
    );
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and document id for pcs', function() {
      expect(CharacterDocumentDetailController.getParamsFromHash('pcs', '#/games/demo/pcs/7/documents/5')).toEqual({
        game_slug: 'demo', character_id: '7', id: '5',
      });
    });

    it('extracts the game slug, character id, and document id for npcs', function() {
      expect(CharacterDocumentDetailController.getParamsFromHash('npcs', '#/games/demo/npcs/9/documents/3')).toEqual({
        game_slug: 'demo', character_id: '9', id: '3',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(CharacterDocumentDetailController.getParamsFromHash('pcs', '#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    [
      ['pcs', '#/games/demo/pcs/7/documents/5', { gameSlug: 'demo', kind: 'pcs', id: '7', documentId: '5' }],
      ['npcs', '#/games/demo/npcs/9/documents/3', { gameSlug: 'demo', kind: 'npcs', id: '9', documentId: '3' }],
    ].forEach(([characterKind, hash, expectedParams]) => {
      describe(`for ${characterKind}`, function() {
        beforeEach(function() {
          client.currentHash.and.returnValue(hash);
        });

        it('fetches the document through RequestStore with the character-owned kind', async function() {
          const cleanup = new CharacterDocumentDetailController(
            characterKind, setDocument, setLoading, setError, setCanEditPages, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(ensureSpy).toHaveBeenCalledWith({
            componentName: 'CharacterDocumentDetailController',
            resource: 'document',
            quantityType: 'single',
            params: expectedParams,
          });
          expect(setDocument).toHaveBeenCalledWith({ id: 1, name: 'Ancient Tome' });
          expect(setLoading).toHaveBeenCalledWith(false);
          expect(setError).not.toHaveBeenCalled();

          cleanup();
        });
      });
    });

    it('sets an error when the fetch rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/documents/5');
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new CharacterDocumentDetailController(
        'pcs', setDocument, setLoading, setError, setCanEditPages, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load document.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7');

      const cleanup = new CharacterDocumentDetailController(
        'pcs', setDocument, setLoading, setError, setCanEditPages, client,
      ).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load document.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/documents/5');

      const cleanup = new CharacterDocumentDetailController(
        'pcs', setDocument, setLoading, setError, setCanEditPages, client,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setDocument).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('canEditPages', function() {
    const runController = async () => {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/documents/5');

      const cleanup = new CharacterDocumentDetailController(
        'pcs', setDocument, setLoading, setError, setCanEditPages, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('calls ensureGameAccess with the game slug independently of the document fetch', async function() {
      await runController();

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    });

    it('is true for a superuser', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_superuser: true }));

      await runController();

      expect(setCanEditPages).toHaveBeenCalledWith(true);
    });

    it('is true for staff', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_staff: true }));

      await runController();

      expect(setCanEditPages).toHaveBeenCalledWith(true);
    });

    it('is true for the game DM', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_dm: true }));

      await runController();

      expect(setCanEditPages).toHaveBeenCalledWith(true);
    });

    it('is true for a player', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_player: true }));

      await runController();

      expect(setCanEditPages).toHaveBeenCalledWith(true);
    });

    it('is false for an unrelated authenticated user', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({
        is_superuser: false, is_staff: false, is_dm: false, is_player: false,
      }));

      await runController();

      expect(setCanEditPages).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the access check rejects', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanEditPages).toHaveBeenCalledWith(false);
    });

    it('defaults to a no-op setter when none is provided', function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/documents/5');

      expect(() => {
        new CharacterDocumentDetailController('pcs', setDocument, setLoading, setError, undefined, client)
          .buildEffect()();
      }).not.toThrow();
    });
  });
});
