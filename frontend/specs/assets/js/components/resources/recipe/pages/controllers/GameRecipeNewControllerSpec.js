import GameRecipeNewController
  from '../../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipeNewController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { RECIPE_FORM_DEFAULTS } from '../../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';

describe('GameRecipeNewController', function() {
  let originalWindow;
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/recipes/new' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('.getGameSlugFromRecipeNewHash', function() {
    it('extracts the game slug', function() {
      expect(GameRecipeNewController.getGameSlugFromRecipeNewHash('#/games/demo/recipes/new')).toBe('demo');
    });
  });

  describe('#buildEffect', function() {
    it('stores can_edit and stays when the caller may create recipes', async function() {
      spyOn(AccessStore, 'ensureGamePermissions')
        .and.returnValue(Promise.resolve({ can_create_recipe: true, can_edit: true }));
      const setCanEditGame = jasmine.createSpy('setCanEditGame');

      new GameRecipeNewController(setCanEditGame).buildEffect()();
      await flush();

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(setCanEditGame).toHaveBeenCalledWith(true);
      expect(globalThis.window.location.hash).toBe('#/games/demo/recipes/new');
    });

    it('redirects to the list when the caller may not create recipes', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_create_recipe: false }));

      new GameRecipeNewController().buildEffect()();
      await flush();

      expect(globalThis.window.location.hash).toBe('/games/demo/recipes');
    });

    it('redirects to the list when the permissions check fails', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

      new GameRecipeNewController().buildEffect()();
      await flush();

      expect(globalThis.window.location.hash).toBe('/games/demo/recipes');
    });
  });

  describe('#submitForm', function() {
    it('POSTs the recipe collection', function() {
      const controller = new GameRecipeNewController();
      spyOn(controller, 'submitRecipe').and.returnValue(Promise.resolve());
      const setters = {};
      const fields = { ...RECIPE_FORM_DEFAULTS, name: 'Brew', output: { id: 3, name: 'Potion' }, hidden: true };

      controller.submitForm(undefined, 'demo', fields, false, setters);

      expect(controller.submitRecipe).toHaveBeenCalledWith(
        undefined,
        jasmine.objectContaining({
          resource: 'recipe',
          method: 'POST',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          body: jasmine.objectContaining({ name: 'Brew', game_common_item_id: 3, hidden: true }),
        }),
        { gameSlug: 'demo', hidden: true, canEditGame: false },
        setters,
      );
    });
  });
});
