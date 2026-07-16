import HeaderGameAccessController from '../../../../../../assets/js/components/common/controllers/HeaderGameAccessController.js';

describe('HeaderGameAccessController', function() {
  let setGameAccess, accessStore, controller;

  beforeEach(function() {
    setGameAccess = jasmine.createSpy('setGameAccess');
    accessStore = jasmine.createSpyObj('accessStore', ['ensureGameAccess']);
    controller = new HeaderGameAccessController(setGameAccess, accessStore);
  });

  describe('#buildEffect', function() {
    it('does nothing and returns undefined when there is no gameSlug', function() {
      expect(controller.buildEffect(undefined)()).toBeUndefined();
      expect(accessStore.ensureGameAccess).not.toHaveBeenCalled();
      expect(setGameAccess).not.toHaveBeenCalled();
    });

    it('fetches and pushes the resolved game access', async function() {
      const access = { is_dm: true, is_player: false, is_superuser: false, is_staff: false };
      accessStore.ensureGameAccess.and.returnValue(Promise.resolve(access));

      const cleanup = controller.buildEffect('epic-quest')();

      expect(accessStore.ensureGameAccess).toHaveBeenCalledWith('epic-quest');

      await Promise.resolve();
      await Promise.resolve();

      expect(setGameAccess).toHaveBeenCalledWith(access);
      expect(cleanup).toEqual(jasmine.any(Function));
    });

    it('does not push the access after the effect has been cleaned up', async function() {
      const access = { is_dm: true, is_player: false, is_superuser: false, is_staff: false };
      accessStore.ensureGameAccess.and.returnValue(Promise.resolve(access));

      const cleanup = controller.buildEffect('epic-quest')();
      cleanup();

      await Promise.resolve();
      await Promise.resolve();

      expect(setGameAccess).not.toHaveBeenCalled();
    });
  });
});
