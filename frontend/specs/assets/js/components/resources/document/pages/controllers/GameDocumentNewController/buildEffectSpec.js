import GameDocumentNewController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameDocumentNewController', function() {
  describe('#buildEffect', function() {
    let fakeWindow;

    beforeEach(function() {
      fakeWindow = { location: { hash: '#/games/demo/documents/new' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('does not redirect when the user can create documents for the game', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
        Promise.resolve({ can_create_document: true }),
      );

      const controller = new GameDocumentNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(fakeWindow.location.hash).toBe('#/games/demo/documents/new');
    });

    it('redirects to the documents list when the user cannot create documents', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
        Promise.resolve({ can_create_document: false }),
      );

      const controller = new GameDocumentNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/documents');
    });

    it('redirects to the documents list when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameDocumentNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/documents');
    });
  });
});
