import GameItemNewController
  from '../../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameItemNewController', function() {
  describe('#buildEffect', function() {
    let fakeWindow;

    beforeEach(function() {
      fakeWindow = { location: { hash: '#/games/demo/items/new' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('does not redirect when the user can create items for the game', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_item: true }));

      const controller = new GameItemNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(fakeWindow.location.hash).toBe('#/games/demo/items/new');
    });

    it('redirects to the items list when the user cannot create items', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_item: false }));

      const controller = new GameItemNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/items');
    });

    it('redirects to the items list when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameItemNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/items');
    });
  });
});
