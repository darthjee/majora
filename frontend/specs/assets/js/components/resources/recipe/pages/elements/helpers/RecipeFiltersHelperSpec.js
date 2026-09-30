import { renderToStaticMarkup } from 'react-dom/server';
import RecipeFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/helpers/RecipeFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('RecipeFiltersHelper', function() {
  describe('.render', function() {
    const render = (category = '') => renderToStaticMarkup(
      RecipeFiltersHelper.render({ category }, { onCategoryChange: Noop.noop }),
    );

    it('renders the category label and the "all" option', function() {
      const html = render();

      expect(html).toContain('Category');
      expect(html).toContain('<option value="" selected="">All</option>');
    });

    it('renders every common item category as an option', function() {
      const html = render();

      expect(html).toContain('value="potion"');
      expect(html).toContain('value="other"');
      expect(html).toContain('Potion');
    });

    it('selects the current category', function() {
      expect(render('gear')).toContain('<option value="gear" selected="">');
    });
  });
});
