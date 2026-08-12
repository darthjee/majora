import GameFactionsController
  from '../../../../../../../../../assets/js/components/resources/faction/pages/controllers/GameFactionsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameFactionsController', function() {
  let setCanCreateFaction;
  let client;

  beforeEach(function() {
    setCanCreateFaction = jasmine.createSpy('setCanCreateFaction');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/factions');
  });

  describe('#buildEffect', function() {
    it('calls ensureGamePermissions with the game slug', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_faction: true }));

      const cleanup = new GameFactionsController(setCanCreateFaction, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      cleanup();
    });

    it('sets canCreateFaction to true when the requester may create factions', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_faction: true }));

      const cleanup = new GameFactionsController(setCanCreateFaction, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateFaction).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('sets canCreateFaction to false when the requester may not create factions', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_faction: false }));

      const cleanup = new GameFactionsController(setCanCreateFaction, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateFaction).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed to false when the permissions check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GameFactionsController(setCanCreateFaction, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateFaction).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_faction: true }));

      const cleanup = new GameFactionsController(setCanCreateFaction, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateFaction).not.toHaveBeenCalled();
    });
  });
});
