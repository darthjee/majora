import GameRecipesController
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipesController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameRecipesController', function() {
  let setCanCreateRecipe;
  let client;

  beforeEach(function() {
    setCanCreateRecipe = jasmine.createSpy('setCanCreateRecipe');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/recipes');
  });

  describe('#buildEffect', function() {
    it('calls ensureGamePermissions with the game slug', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_recipe: true }));

      const cleanup = new GameRecipesController(setCanCreateRecipe, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      cleanup();
    });

    it('sets canCreateRecipe to true when the requester may create recipes', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_recipe: true }));

      const cleanup = new GameRecipesController(setCanCreateRecipe, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateRecipe).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('sets canCreateRecipe to false when the requester may not create recipes', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_recipe: false }));

      const cleanup = new GameRecipesController(setCanCreateRecipe, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateRecipe).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed to false when the permissions check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = new GameRecipesController(setCanCreateRecipe, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateRecipe).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_recipe: true }));

      const cleanup = new GameRecipesController(setCanCreateRecipe, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanCreateRecipe).not.toHaveBeenCalled();
    });
  });
});
