import { renderToStaticMarkup } from 'react-dom/server';
import shortListResourceConfig from '../../../../../../assets/js/components/common/cards/shortListResourceConfig.js';
import RecipePreviewCard from '../../../../../../assets/js/components/common/cards/RecipePreviewCard.jsx';
import CharacterPreviewCard from '../../../../../../assets/js/components/common/cards/CharacterPreviewCard.jsx';

describe('shortListResourceConfig', function() {
  describe('.commonItemRecipe', function() {
    const config = shortListResourceConfig.commonItemRecipe;
    const context = { game_slug: 'demo', id: 4 };

    it('fetches recipe.commonItemCollection', function() {
      expect(config.requestResource).toBe('recipe');
      expect(config.quantityType).toBe('commonItemCollection');
    });

    it('builds fetch params from the game slug and the common item id', function() {
      expect(config.buildParams(context)).toEqual({ gameSlug: 'demo', commonItemId: 4 });
    });

    it('has no see all href', function() {
      expect(config.buildSeeAllHref).toBeUndefined();
    });

    it("navigates to the recipe's own page", function() {
      expect(config.action).toBe('navigate');
      expect(config.buildHref(context, { id: 2 })).toBe('#/games/demo/recipes/2');
    });

    it('uses the recipes preview title and empty text', function() {
      expect(config.titleKey).toBe('common_item_recipes_preview.title');
      expect(config.emptyTextKey).toBe('common_item_recipes_preview.empty');
    });

    it('renders a RecipePreviewCard with the resolved href', function() {
      const element = config.renderItem({ id: 2, name: 'Brew', output: null }, context, '#/games/demo/recipes/2');

      expect(element.type).toBe(RecipePreviewCard);
      expect(renderToStaticMarkup(element)).toContain('href="#/games/demo/recipes/2"');
    });
  });

  describe('.recipe', function() {
    const config = shortListResourceConfig.recipe;
    const pcContext = { game_slug: 'demo', id: 7, is_pc: true };
    const npcContext = { game_slug: 'demo', id: 9, is_pc: false };

    it('fetches characterRecipe.collection', function() {
      expect(config.requestResource).toBe('characterRecipe');
      expect(config.quantityType).toBe('collection');
    });

    it('builds fetch params from the character context', function() {
      expect(config.buildParams(pcContext)).toEqual({ gameSlug: 'demo', kind: 'pcs', id: 7 });
      expect(config.buildParams(npcContext)).toEqual({ gameSlug: 'demo', kind: 'npcs', id: 9 });
    });

    it("links the see all card to the character's recipes page", function() {
      expect(config.buildSeeAllHref(pcContext)).toBe('#/games/demo/pcs/7/recipes');
      expect(config.buildSeeAllHref(npcContext)).toBe('#/games/demo/npcs/9/recipes');
    });

    it('navigates to the character recipe detail page by row id', function() {
      expect(config.action).toBe('navigate');
      expect(config.buildHref(pcContext, { id: 3, game_recipe_id: 12 })).toBe('#/games/demo/pcs/7/recipes/3');
      expect(config.buildHref(npcContext, { id: 3, game_recipe_id: 12 })).toBe('#/games/demo/npcs/9/recipes/3');
    });

    it('uses the character recipes title and empty text', function() {
      expect(config.titleKey).toBe('character_page.recipes_title');
      expect(config.emptyTextKey).toBe('character_recipes_preview.empty');
    });

    it('renders a RecipePreviewCard with the resolved href, even with a masked output', function() {
      const element = config.renderItem(
        { id: 3, name: 'Brew', output: null }, pcContext, '#/games/demo/pcs/7/recipes/3',
      );

      expect(element.type).toBe(RecipePreviewCard);
      expect(renderToStaticMarkup(element)).toContain('href="#/games/demo/pcs/7/recipes/3"');
    });
  });

  describe('.recipeCharacter', function() {
    const config = shortListResourceConfig.recipeCharacter;
    const context = { game_slug: 'demo', id: 4 };

    it('fetches recipe.characters', function() {
      expect(config.requestResource).toBe('recipe');
      expect(config.quantityType).toBe('characters');
    });

    it('builds fetch params from the game slug and the recipe id', function() {
      expect(config.buildParams(context)).toEqual({ gameSlug: 'demo', id: 4 });
    });

    it('has no see all href', function() {
      expect(config.buildSeeAllHref).toBeUndefined();
    });

    it("navigates by each entry's own type", function() {
      expect(config.action).toBe('navigate');
      expect(config.buildHref(context, { id: 7, type: 'pc' })).toBe('#/games/demo/pcs/7');
      expect(config.buildHref(context, { id: 9, type: 'npc' })).toBe('#/games/demo/npcs/9');
    });

    it('uses the known by title and empty text', function() {
      expect(config.titleKey).toBe('recipe_page.known_by_title');
      expect(config.emptyTextKey).toBe('recipe_characters_preview.empty');
    });

    ['pc', 'npc'].forEach((type) => {
      it(`renders a CharacterPreviewCard for a ${type} entry`, function() {
        const item = { id: 7, name: 'Aria', type };
        const element = config.renderItem(item, context);

        expect(element.type).toBe(CharacterPreviewCard);
        expect(element.props).toEqual({ character: item, gameSlug: 'demo', characterType: type });
      });
    });
  });
});
