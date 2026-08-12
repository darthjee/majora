import GamePossessionsController
  from '../../../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GamePossessionsController', function() {
  let setCanCreatePossession;
  let client;

  beforeEach(function() {
    setCanCreatePossession = jasmine.createSpy('setCanCreatePossession');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/possessions');
  });

  describe('#buildEffect', function() {
    it('calls ensureGamePermissions with the game slug', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_possession: true }));

      const cleanup = new GamePossessionsController(setCanCreatePossession, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      cleanup();
    });

    it('sets canCreatePossession to true when the requester may create possessions', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_possession: true }));

      const cleanup = new GamePossessionsController(setCanCreatePossession, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('sets canCreatePossession to false when the requester may not create possessions', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_possession: false }));

      const cleanup = new GamePossessionsController(setCanCreatePossession, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed to false when the permissions check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GamePossessionsController(setCanCreatePossession, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_possession: true }));

      const cleanup = new GamePossessionsController(setCanCreatePossession, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreatePossession).not.toHaveBeenCalled();
    });
  });
});
