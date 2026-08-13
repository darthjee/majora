import CharacterPossessionsAccessController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionsAccessController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterPossessionsAccessController', function() {
  describe('#buildEffect', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('sets can_create_possession to true when the permission resolves true', async function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/possessions' } };
      const setCanCreatePossession = jasmine.createSpy('setCanCreatePossession');
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_edit: false, can_create_possession: true }));

      const controller = new CharacterPossessionsAccessController('pcs', setCanCreatePossession);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '7');
      expect(setCanCreatePossession).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets can_create_possession to false when the permission resolves false', async function() {
      globalThis.window = { location: { hash: '#/games/demo/npcs/9/possessions' } };
      const setCanCreatePossession = jasmine.createSpy('setCanCreatePossession');
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_possession: false }));

      const controller = new CharacterPossessionsAccessController('npcs', setCanCreatePossession);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('fails closed (false) when the access request throws', async function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/possessions' } };
      const setCanCreatePossession = jasmine.createSpy('setCanCreatePossession');
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new CharacterPossessionsAccessController('pcs', setCanCreatePossession);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/possessions' } };
      const setCanCreatePossession = jasmine.createSpy('setCanCreatePossession');
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_possession: true }));

      const controller = new CharacterPossessionsAccessController('pcs', setCanCreatePossession);
      const cleanup = controller.buildEffect()();

      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).not.toHaveBeenCalled();
    });

    it('defaults setCanCreatePossession to a no-op', function() {
      globalThis.window = { location: { hash: '#/games/demo/pcs/7/possessions' } };
      spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_create_possession: true }));

      expect(() => new CharacterPossessionsAccessController('pcs').buildEffect()()).not.toThrow();
    });
  });
});
