import { renderToStaticMarkup } from 'react-dom/server';
import RecipePreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/RecipePreviewCardHelper.jsx';

describe('RecipePreviewCardHelper', function() {
  const recipe = { id: 2, name: 'Brew', output: null };

  describe('.render', function() {
    it('renders the grid-cell column classes', function() {
      expect(renderToStaticMarkup(RecipePreviewCardHelper.render(recipe))).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the placeholder for a masked output', function() {
      expect(renderToStaticMarkup(RecipePreviewCardHelper.render(recipe))).toContain('default_common_item.png');
    });

    it("renders the output's photo", function() {
      const html = renderToStaticMarkup(RecipePreviewCardHelper.render({ ...recipe, output: { photo_path: '/p.png' } }));

      expect(html).toContain('src="/p.png"');
    });

    it('wraps the card in a link when href is given', function() {
      const html = renderToStaticMarkup(RecipePreviewCardHelper.render(recipe, '#/games/demo/recipes/2'));

      expect(html).toContain('<a href="#/games/demo/recipes/2"');
    });
  });
});
