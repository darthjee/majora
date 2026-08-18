import GameCommonItemsController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameCommonItemsController', function() {
  let setCanCreateCommonItem;
  let client;

  beforeEach(function() {
    setCanCreateCommonItem = jasmine.createSpy('setCanCreateCommonItem');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/common_items');
  });

  describe('#buildEffect', function() {
    it('calls ensureGamePermissions with the game slug', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_common_item: true }));

      const cleanup = new GameCommonItemsController(setCanCreateCommonItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      cleanup();
    });

    it('sets canCreateCommonItem to true when the requester may create common items', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_common_item: true }));

      const cleanup = new GameCommonItemsController(setCanCreateCommonItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateCommonItem).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('sets canCreateCommonItem to false when the requester may not create common items', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_common_item: false }));

      const cleanup = new GameCommonItemsController(setCanCreateCommonItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateCommonItem).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed to false when the permissions check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GameCommonItemsController(setCanCreateCommonItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateCommonItem).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_common_item: true }));

      const cleanup = new GameCommonItemsController(setCanCreateCommonItem, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateCommonItem).not.toHaveBeenCalled();
    });
  });
});
