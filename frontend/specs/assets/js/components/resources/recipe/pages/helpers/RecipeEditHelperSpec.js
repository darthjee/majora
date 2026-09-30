import { renderToStaticMarkup } from 'react-dom/server';
import RecipeEditHelper from '../../../../../../../../assets/js/components/resources/recipe/pages/helpers/RecipeEditHelper.jsx';
import { RECIPE_FORM_DEFAULTS } from '../../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('RecipeEditHelper', function() {
  const handlers = new Proxy({}, { get: () => Noop.noop });

  describe('.render', function() {
    it('renders the edit form with the hidden switch in the left column', function() {
      const html = renderToStaticMarkup(RecipeEditHelper.render({
        ...RECIPE_FORM_DEFAULTS,
        name: 'Brew',
        output: { id: null, name: 'Unknown item' },
        status: 'idle',
        fieldErrors: {},
        canEditGame: true,
        game_slug: 'demo',
      }, handlers));

      expect(html).toContain('Edit Recipe');
      expect(html).toContain('value="Brew"');
      expect(html).toContain('Unknown item');
      expect(html.indexOf('id="recipe-edit-hidden"')).toBeLessThan(html.indexOf('col-md-8'));
      expect(html).toContain('Save changes');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      expect(renderToStaticMarkup(RecipeEditHelper.renderLoading())).toContain('Loading recipe...');
    });
  });

  describe('.renderError', function() {
    it('renders the error', function() {
      expect(renderToStaticMarkup(RecipeEditHelper.renderError('Boom'))).toContain('Boom');
    });
  });
});
