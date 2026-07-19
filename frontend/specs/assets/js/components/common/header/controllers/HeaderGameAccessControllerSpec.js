import HeaderGameAccessController from '../../../../../../../assets/js/components/common/header/controllers/HeaderGameAccessController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const ABORTED_DEFAULT = { is_superuser: null, is_staff: null, is_dm: null, is_player: false };

describe('HeaderGameAccessController', function() {
  let setGameAccess, accessStore, accessEvents, controller;

  beforeEach(function() {
    setGameAccess = jasmine.createSpy('setGameAccess');
    accessStore = jasmine.createSpyObj('accessStore', ['ensureGameAccess', 'getGameAccess']);
    accessEvents = jasmine.createSpyObj('accessEvents', ['subscribe', 'unsubscribe']);
    controller = new HeaderGameAccessController(setGameAccess, accessStore, accessEvents);
  });

  describe('#buildEffect', function() {
    it('does nothing and returns undefined when there is no gameSlug', function() {
      expect(controller.buildEffect(undefined)()).toBeUndefined();
      expect(accessStore.ensureGameAccess).not.toHaveBeenCalled();
      expect(setGameAccess).not.toHaveBeenCalled();
      expect(accessEvents.subscribe).not.toHaveBeenCalled();
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

    it('subscribes to AccessEvents and unsubscribes on cleanup', function() {
      accessStore.ensureGameAccess.and.returnValue(new Promise(Noop.noop));

      const cleanup = controller.buildEffect('epic-quest')();

      expect(accessEvents.subscribe).toHaveBeenCalledWith(jasmine.any(Function));
      expect(accessEvents.unsubscribe).not.toHaveBeenCalled();

      cleanup();

      expect(accessEvents.unsubscribe).toHaveBeenCalledWith(accessEvents.subscribe.calls.mostRecent().args[0]);
    });

    it('re-reads the cache and pushes it whenever an access:changed event fires', function() {
      accessStore.ensureGameAccess.and.returnValue(new Promise(Noop.noop));

      controller.buildEffect('epic-quest')();

      const access = { is_dm: false, is_player: true, is_superuser: false, is_staff: false };
      accessStore.getGameAccess.and.returnValue(access);

      const handler = accessEvents.subscribe.calls.mostRecent().args[0];
      handler();

      expect(accessStore.getGameAccess).toHaveBeenCalledWith('epic-quest');
      expect(setGameAccess).toHaveBeenCalledWith(access);
    });

    it('recovers with a real access payload after its own fetch resolves aborted-default (race with AccessStore.reset)', async function() {
      const realAccess = { is_dm: false, is_player: true, is_superuser: false, is_staff: false };

      accessStore.ensureGameAccess.and.returnValues(
        Promise.resolve(ABORTED_DEFAULT),
        Promise.resolve(realAccess)
      );

      controller.buildEffect('epic-quest')();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(accessStore.ensureGameAccess).toHaveBeenCalledTimes(2);
      expect(setGameAccess).toHaveBeenCalledWith(ABORTED_DEFAULT);
      expect(setGameAccess).toHaveBeenCalledWith(realAccess);
      expect(setGameAccess.calls.mostRecent().args[0]).toEqual(realAccess);
    });

    it('retries only once even if the retry also resolves aborted-default', async function() {
      accessStore.ensureGameAccess.and.returnValue(Promise.resolve(ABORTED_DEFAULT));

      controller.buildEffect('epic-quest')();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(accessStore.ensureGameAccess).toHaveBeenCalledTimes(2);
    });

    it('does not retry when the first resolution is a genuinely different (non-default) payload', async function() {
      const access = { is_dm: true, is_player: false, is_superuser: false, is_staff: false };
      accessStore.ensureGameAccess.and.returnValue(Promise.resolve(access));

      controller.buildEffect('epic-quest')();

      await Promise.resolve();
      await Promise.resolve();

      expect(accessStore.ensureGameAccess).toHaveBeenCalledTimes(1);
    });
  });
});
