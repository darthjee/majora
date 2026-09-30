import { renderToStaticMarkup } from 'react-dom/server';
import RecipeDetailHelper
  from '../../../../../../../../assets/js/components/resources/recipe/pages/helpers/RecipeDetailHelper.jsx';

describe('RecipeDetailHelper', function() {
  const recipe = {
    id: 5,
    name: 'Brew',
    output: { id: 3, name: 'Healing Potion', photo_path: '/photos/3.png', category: 'potion' },
    yield_quantity: 2,
    crafting_time: '1 hour',
    crafting_cost: 500,
    description: 'Mix well.',
    ingredients: 'Herbs',
    checks: 'DC 12',
    hidden: true,
  };
  const links = { gameSlug: 'demo', backHref: '#/games/demo/recipes', editHref: '#/games/demo/recipes/5/edit' };

  describe('.render', function() {
    it('renders the back link and the recipe fields', function() {
      const html = renderToStaticMarkup(RecipeDetailHelper.render(recipe, links));

      expect(html).toContain('href="#/games/demo/recipes"');
      expect(html).toContain('<h1>Brew</h1>');
      expect(html).toContain('href="#/games/demo/common_items/3"');
      expect(html).toContain('Healing Potion');
      expect(html).toContain('1 hour');
      expect(html).toContain('5 GP');
      expect(html).toContain('Mix well.');
      expect(html).toContain('Herbs');
      expect(html).toContain('DC 12');
      expect(html).toContain('recipe-hidden-badge');
      expect(html).toContain('src="/photos/3.png"');
    });

    it('does not render the edit button when canEdit is false', function() {
      expect(renderToStaticMarkup(RecipeDetailHelper.render(recipe, links))).not.toContain('/recipes/5/edit');
    });

    it('renders the edit button when canEdit is true', function() {
      const html = renderToStaticMarkup(RecipeDetailHelper.render(recipe, links, true));

      expect(html).toContain('href="#/games/demo/recipes/5/edit"');
      expect(html).toContain('Edit');
    });

    it('does not render a photo upload affordance', function() {
      expect(renderToStaticMarkup(RecipeDetailHelper.render(recipe, links, true))).not.toContain('bi-upload');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      expect(renderToStaticMarkup(RecipeDetailHelper.renderLoading())).toContain('Loading recipe...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      expect(renderToStaticMarkup(RecipeDetailHelper.renderError('Unable to load recipe.')))
        .toContain('Unable to load recipe.');
    });
  });
});
