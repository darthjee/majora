import { renderToStaticMarkup } from 'react-dom/server';
import StlModelsHelper from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx';

describe('StlModelsHelper', function() {
  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render());
      expect(html).toContain('href="#/"');
    });

    it('renders the shared ListPage grid for the stlModels list type', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render());
      expect(html).toContain('container');
    });
  });
});
