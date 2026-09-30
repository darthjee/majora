import { renderToStaticMarkup } from 'react-dom/server';
import shortListResourceConfig from '../../../../../../assets/js/components/common/cards/shortListResourceConfig.js';
import RecipePreviewCard from '../../../../../../assets/js/components/common/cards/RecipePreviewCard.jsx';

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
});
