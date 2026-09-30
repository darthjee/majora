import {
  RECIPE_FORM_DEFAULTS, buildOutputPicker, toOutputPick, buildRecipeBody, savedRecipePath,
} from '../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';

describe('recipeForm', function() {
  const fields = {
    ...RECIPE_FORM_DEFAULTS,
    name: 'Brew',
    output: { id: 3, name: 'Healing Potion' },
    yield_quantity: '2',
    crafting_time: '1 hour',
    crafting_cost: '500',
    description: 'Mix.',
    ingredients: 'Herbs',
    checks: 'DC 12',
    hidden: true,
  };

  describe('buildOutputPicker', function() {
    it('searches the game common items, 5 at a time', function() {
      expect(buildOutputPicker('demo')).toEqual({ resource: 'commonItem', maxEntries: 5, params: { gameSlug: 'demo' } });
    });
  });

  describe('toOutputPick', function() {
    it('shapes an output as {id, name}', function() {
      expect(toOutputPick({ id: 3, name: 'Healing Potion', photo_path: 'x' })).toEqual({ id: 3, name: 'Healing Potion' });
    });

    it('shapes a masked output as an id-less unknown placeholder', function() {
      expect(toOutputPick(null)).toEqual({ id: null, name: 'Unknown item' });
    });
  });

  describe('buildRecipeBody', function() {
    it('builds the write body with the picked output', function() {
      expect(buildRecipeBody(fields)).toEqual({
        name: 'Brew',
        yield_quantity: 2,
        crafting_time: '1 hour',
        crafting_cost: 500,
        description: 'Mix.',
        ingredients: 'Herbs',
        checks: 'DC 12',
        hidden: true,
        game_common_item_id: 3,
      });
    });

    it('omits the output when none was picked', function() {
      expect(buildRecipeBody({ ...fields, output: null }).game_common_item_id).toBeUndefined();
    });

    it('omits the output when it is unchanged', function() {
      expect(buildRecipeBody(fields, 3).game_common_item_id).toBeUndefined();
    });

    it('omits a masked output placeholder', function() {
      expect(buildRecipeBody({ ...fields, output: { id: null, name: 'Unknown item' } }, null).game_common_item_id)
        .toBeUndefined();
    });

    it('sends a re-picked output', function() {
      expect(buildRecipeBody({ ...fields, output: { id: 4, name: 'Antidote' } }, null).game_common_item_id).toBe(4);
    });

    it('defaults invalid numbers', function() {
      const body = buildRecipeBody({ ...fields, yield_quantity: '', crafting_cost: '' });

      expect(body.yield_quantity).toBe(1);
      expect(body.crafting_cost).toBe(0);
    });
  });

  describe('savedRecipePath', function() {
    it('goes to the show page', function() {
      expect(savedRecipePath('demo', 5, false, false)).toBe('/games/demo/recipes/5');
    });

    it('goes to the show page for a hidden recipe saved by a game editor', function() {
      expect(savedRecipePath('demo', 5, true, true)).toBe('/games/demo/recipes/5');
    });

    it('goes to the list for a hidden recipe saved without game can_edit', function() {
      expect(savedRecipePath('demo', 5, true, false)).toBe('/games/demo/recipes');
    });
  });
});
