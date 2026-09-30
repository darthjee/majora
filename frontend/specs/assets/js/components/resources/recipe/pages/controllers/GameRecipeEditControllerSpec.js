import GameRecipeEditController
  from '../../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipeEditController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { RECIPE_FORM_DEFAULTS } from '../../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';

describe('GameRecipeEditController', function() {
  let setters;
  let client;
  let ensureSpy;
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const build = () => new GameRecipeEditController(setters, client);

  beforeEach(function() {
    setters = {
      setRecipe: jasmine.createSpy('setRecipe'),
      setLoading: jasmine.createSpy('setLoading'),
      setError: jasmine.createSpy('setError'),
      setCanEditGame: jasmine.createSpy('setCanEditGame'),
    };
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/recipes/5/edit');
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 5, name: 'Brew' } }));
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and recipe id', function() {
      expect(GameRecipeEditController.getParamsFromHash('#/games/demo/recipes/5/edit'))
        .toEqual({ game_slug: 'demo', id: '5' });
    });
  });

  describe('#buildEffect', function() {
    it('loads the recipe and the game can_edit', async function() {
      const cleanup = build().buildEffect()();
      await flush();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameRecipeEditController',
        resource: 'recipe',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
      });
      expect(setters.setRecipe).toHaveBeenCalledWith({ id: 5, name: 'Brew' });
      expect(setters.setCanEditGame).toHaveBeenCalledWith(true);
      expect(setters.setLoading).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('fails closed on the game permissions', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = build().buildEffect()();
      await flush();

      expect(setters.setCanEditGame).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('sets an error when the recipe fails to load', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('404')));

      const cleanup = build().buildEffect()();
      await flush();

      expect(setters.setError).toHaveBeenCalledWith('Unable to load recipe.');
      cleanup();
    });

    it('sets an error for a non-matching hash', function() {
      client.currentHash.and.returnValue('#/games/demo');

      build().buildEffect()();

      expect(setters.setError).toHaveBeenCalledWith('Unable to load recipe.');
      expect(setters.setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();
    });
  });

  describe('#applyLoadedRecipe', function() {
    it('does nothing while not loaded', function() {
      const setField = jasmine.createSpy('setField');

      build().applyLoadedRecipe(null, setField);

      expect(setField).not.toHaveBeenCalled();
    });

    it('pre-fills every field', function() {
      const values = {};
      const recipe = {
        name: 'Brew',
        output: { id: 3, name: 'Potion', photo_path: null },
        yield_quantity: 2,
        crafting_time: null,
        crafting_cost: 500,
        description: 'Mix.',
        ingredients: 'Herbs',
        checks: 'DC 12',
        hidden: true,
      };

      build().applyLoadedRecipe(recipe, (field, value) => { values[field] = value; });

      expect(values).toEqual({
        name: 'Brew',
        output: { id: 3, name: 'Potion' },
        yield_quantity: '2',
        crafting_time: '',
        crafting_cost: '500',
        description: 'Mix.',
        ingredients: 'Herbs',
        checks: 'DC 12',
        hidden: true,
      });
    });

    it('uses the unknown placeholder and defaults for a masked, sparse recipe', function() {
      const values = {};

      build().applyLoadedRecipe({ name: 'Brew', output: null }, (field, value) => { values[field] = value; });

      expect(values.output).toEqual({ id: null, name: 'Unknown item' });
      expect(values.yield_quantity).toBe('1');
      expect(values.crafting_cost).toBe('0');
      expect(values.hidden).toBe(false);
    });
  });

  describe('#submitForm', function() {
    it('PATCHes the recipe without an unchanged output', function() {
      const controller = build();
      spyOn(controller, 'submitRecipe').and.returnValue(Promise.resolve());
      const pageSetters = {};
      const fields = { ...RECIPE_FORM_DEFAULTS, name: 'Brew', output: { id: 3, name: 'Potion' } };

      controller.submitForm(
        undefined,
        {
          gameSlug: 'demo', recipeId: '5', initialOutputId: 3, canEditGame: true,
        },
        fields,
        pageSetters,
      );

      const [, mutation, context] = controller.submitRecipe.calls.mostRecent().args;

      expect(mutation).toEqual(jasmine.objectContaining({
        resource: 'recipe', method: 'PATCH', quantityType: 'single', params: { gameSlug: 'demo', id: '5' },
      }));
      expect(mutation.body.game_common_item_id).toBeUndefined();
      expect(context).toEqual({
        gameSlug: 'demo', recipeId: '5', hidden: false, canEditGame: true,
      });
    });
  });
});
