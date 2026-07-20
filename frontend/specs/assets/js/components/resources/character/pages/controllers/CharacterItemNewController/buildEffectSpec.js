import CharacterItemNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterItemNewController', function() {
  describe('#buildEffect', function() {
    let fakeWindow;

    beforeEach(function() {
      fakeWindow = { location: { hash: '#/games/demo/pcs/7/items/new' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('does not redirect when the user can create items for the character', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_create_item: true }));

      const controller = new CharacterItemNewController('pcs', Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '7');
      expect(fakeWindow.location.hash).toBe('#/games/demo/pcs/7/items/new');
    });

    it('redirects to the items list when the user cannot create items', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_create_item: false }));

      const controller = new CharacterItemNewController('pcs', Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/pcs/7/items');
    });

    it('redirects to the items list when the access request throws', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new CharacterItemNewController('pcs', Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/pcs/7/items');
    });
  });
});
