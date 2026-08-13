import CharacterPossessionNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterPossessionNewController', function() {
  describe('#buildEffect', function() {
    let fakeWindow;

    beforeEach(function() {
      fakeWindow = { location: { hash: '#/games/demo/pcs/7/possessions/new' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('does not redirect when the user can create possessions for the character', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_possession: true }));

      const controller = new CharacterPossessionNewController('pcs', Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '7');
      expect(fakeWindow.location.hash).toBe('#/games/demo/pcs/7/possessions/new');
    });

    it('redirects to the possessions list when the user cannot create possessions', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_possession: false }));

      const controller = new CharacterPossessionNewController('pcs', Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/pcs/7/possessions');
    });

    it('redirects to the possessions list when the access request throws', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new CharacterPossessionNewController('pcs', Noop.noop);
      controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/pcs/7/possessions');
    });
  });
});
