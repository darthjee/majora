import GameItemsController
  from '../../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameItemsController', function() {
  let setCanCreateItem;
  let client;

  beforeEach(function() {
    setCanCreateItem = jasmine.createSpy('setCanCreateItem');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/items');
  });

  describe('#buildEffect', function() {
    it('calls ensureGamePermissions with the game slug', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_item: true }));

      const cleanup = new GameItemsController(setCanCreateItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      cleanup();
    });

    it('sets canCreateItem to true when the requester may create items', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_item: true }));

      const cleanup = new GameItemsController(setCanCreateItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('sets canCreateItem to false when the requester may not create items', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_item: false }));

      const cleanup = new GameItemsController(setCanCreateItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed to false when the permissions check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GameItemsController(setCanCreateItem, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_item: true }));

      const cleanup = new GameItemsController(setCanCreateItem, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateItem).not.toHaveBeenCalled();
    });
  });
});
