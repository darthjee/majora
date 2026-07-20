import CharacterItemsAccessController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemsAccessController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterItemsAccessController', function() {
  describe('#buildEffect', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('sets can_create_item to true when the permission resolves true', async function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/items' } };
      const setCanCreateItem = jasmine.createSpy('setCanCreateItem');
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_edit: false, can_create_item: true }));

      const controller = new CharacterItemsAccessController('pcs', setCanCreateItem);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '7');
      expect(setCanCreateItem).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets can_create_item to false when the permission resolves false', async function() {
      globalThis.window = { location: { hash: '#/games/demo/npcs/9/items' } };
      const setCanCreateItem = jasmine.createSpy('setCanCreateItem');
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_item: false }));

      const controller = new CharacterItemsAccessController('npcs', setCanCreateItem);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('fails closed (false) when the access request throws', async function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/items' } };
      const setCanCreateItem = jasmine.createSpy('setCanCreateItem');
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new CharacterItemsAccessController('pcs', setCanCreateItem);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/items' } };
      const setCanCreateItem = jasmine.createSpy('setCanCreateItem');
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_item: true }));

      const controller = new CharacterItemsAccessController('pcs', setCanCreateItem);
      const cleanup = controller.buildEffect()();

      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).not.toHaveBeenCalled();
    });

    it('defaults setCanCreateItem to a no-op', function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/items' } };
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_create_item: true }));

      expect(() => new CharacterItemsAccessController('pcs').buildEffect()()).not.toThrow();
    });
  });
});
