import GameNpcsAccessController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsAccessController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('GameNpcsAccessController', function() {
  beforeEach(function() {
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_npc: false }));
  });

  it('sets isPlayer to true when the requester is a player of the game', async function() {
    const setIsPlayer = jasmine.createSpy('setIsPlayer');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));

    const cleanup = new GameNpcsAccessController('demo', setIsPlayer).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    expect(setIsPlayer).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('sets isPlayer to false when the requester is not a player of the game', async function() {
    const setIsPlayer = jasmine.createSpy('setIsPlayer');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: false }));

    const cleanup = new GameNpcsAccessController('demo', setIsPlayer).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setIsPlayer).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('defaults isPlayer to false when the access check fails', async function() {
    const setIsPlayer = jasmine.createSpy('setIsPlayer');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('nope')));

    const cleanup = new GameNpcsAccessController('demo', setIsPlayer).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setIsPlayer).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not update state after unmount', async function() {
    const setIsPlayer = jasmine.createSpy('setIsPlayer');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));

    const cleanup = new GameNpcsAccessController('demo', setIsPlayer).buildEffect()();
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setIsPlayer).not.toHaveBeenCalled();
  });

  it('defaults setIsPlayer to a no-op', function() {
    expect(() => new GameNpcsAccessController('demo')).not.toThrow();
  });

  describe('canCreateNpc resolution (issue #868)', function() {
    beforeEach(function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: false }));
    });

    it('sets canCreateNpc to true when the permissions grant can_create_npc', async function() {
      const setCanCreateNpc = jasmine.createSpy('setCanCreateNpc');
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_create_npc: true }));

      const cleanup = new GameNpcsAccessController('demo', undefined, setCanCreateNpc).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(setCanCreateNpc).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets canCreateNpc to false when the permissions do not grant can_create_npc', async function() {
      const setCanCreateNpc = jasmine.createSpy('setCanCreateNpc');
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_create_npc: false }));

      const cleanup = new GameNpcsAccessController('demo', undefined, setCanCreateNpc).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateNpc).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('defaults canCreateNpc to false when the permissions request fails', async function() {
      const setCanCreateNpc = jasmine.createSpy('setCanCreateNpc');
      AccessStore.ensureGamePermissions.and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GameNpcsAccessController('demo', undefined, setCanCreateNpc).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateNpc).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update canCreateNpc after unmount', async function() {
      const setCanCreateNpc = jasmine.createSpy('setCanCreateNpc');
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_create_npc: true }));

      const cleanup = new GameNpcsAccessController('demo', undefined, setCanCreateNpc).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateNpc).not.toHaveBeenCalled();
    });

    it('defaults setCanCreateNpc to a no-op', function() {
      expect(() => new GameNpcsAccessController('demo', Noop.noop)).not.toThrow();
    });
  });
});
