import GameDocumentEditController
  from '../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentEditController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameDocumentEditController', function() {
  let setDocument;
  let setLoading;
  let setError;
  let setCanUploadPhoto;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setDocument = jasmine.createSpy('setDocument');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    client.currentHash.and.returnValue('#/games/demo/documents/5/edit');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 5, name: 'Ancient Scroll' } }),
    );
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and document id', function() {
      expect(GameDocumentEditController.getParamsFromHash('#/games/demo/documents/5/edit')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameDocumentEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the document through RequestStore with the game-owned kind', async function() {
      const cleanup = new GameDocumentEditController(setDocument, setLoading, setError, setCanUploadPhoto, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameDocumentEditController',
        resource: 'document',
        quantityType: 'single',
        params: { gameSlug: 'demo', kind: 'game', id: '5' },
      });
      expect(setDocument).toHaveBeenCalledWith({ id: 5, name: 'Ancient Scroll' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameDocumentEditController(setDocument, setLoading, setError, setCanUploadPhoto, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load document.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GameDocumentEditController(setDocument, setLoading, setError, setCanUploadPhoto, client)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load document.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = new GameDocumentEditController(setDocument, setLoading, setError, setCanUploadPhoto, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setDocument).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('canUploadPhoto', function() {
    const runController = async () => {
      const cleanup = new GameDocumentEditController(setDocument, setLoading, setError, setCanUploadPhoto, client)
        .buildEffect()();
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

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for staff', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_staff: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for the game DM', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_dm: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for a player', async function() {
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
});
