import GameCommonItemNewController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameCommonItemNewController', function() {
  describe('#buildEffect', function() {
    let fakeWindow;

    beforeEach(function() {
      fakeWindow = { location: { hash: '#/games/demo/common_items/new' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('does not redirect when the user can create common items for the game', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_common_item: true }));

      const controller = new GameCommonItemNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(fakeWindow.location.hash).toBe('#/games/demo/common_items/new');
    });

    it('redirects to the common items list when the user cannot create common items', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_common_item: false }));

      const controller = new GameCommonItemNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/common_items');
    });

    it('redirects to the common items list when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameCommonItemNewController(Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/common_items');
    });
  });
});
