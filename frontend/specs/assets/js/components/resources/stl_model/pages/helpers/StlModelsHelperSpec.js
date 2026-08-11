import { renderToStaticMarkup } from 'react-dom/server';
import StlModelsHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx';

describe('StlModelsHelper', function() {
  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(false));
      expect(html).toContain('href="#/"');
    });

    it('renders the shared ListPage grid for the stlModels list type', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(false));
      expect(html).toContain('container');
    });

    it('renders the New STL model link when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(true));
      expect(html).toContain('New STL Model');
      expect(html).toContain('href="#/miniatures/stl_models/new"');
    });

    it('does not render the New STL model link when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(false));
      expect(html).not.toContain('New STL Model');
    });
  });
});
