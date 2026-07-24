import GameDocumentController
  from '../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameDocumentController', function() {
  let setDocument;
  let setLoading;
  let setError;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setDocument = jasmine.createSpy('setDocument');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    client.currentHash.and.returnValue('#/games/demo/documents/5');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 5, name: 'Ancient Scroll' } }),
    );
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and document id', function() {
      expect(GameDocumentController.getParamsFromHash('#/games/demo/documents/5')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameDocumentController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the document through RequestStore with the game-owned kind', async function() {
      const cleanup = new GameDocumentController(setDocument, setLoading, setError, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameDocumentController',
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

      const cleanup = new GameDocumentController(setDocument, setLoading, setError, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load document.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GameDocumentController(setDocument, setLoading, setError, client).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load document.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = new GameDocumentController(setDocument, setLoading, setError, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setDocument).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
