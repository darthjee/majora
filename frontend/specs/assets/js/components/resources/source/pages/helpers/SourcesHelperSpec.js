import { renderToStaticMarkup } from 'react-dom/server';
import SourcesHelper
  from '../../../../../../../../assets/js/components/resources/source/pages/helpers/SourcesHelper.jsx';

describe('SourcesHelper', function() {
  const buildHandlers = () => ({ onNewClick: jasmine.createSpy('onNewClick') });

  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(SourcesHelper.render(false, 0, buildHandlers()));
      expect(html).toContain('href="#/"');
    });

    it('renders the shared ListPage grid for the sources list type', function() {
      const html = renderToStaticMarkup(SourcesHelper.render(false, 0, buildHandlers()));
      expect(html).toContain('container');
    });

    it('renders the New Source button when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(SourcesHelper.render(true, 0, buildHandlers()));
      expect(html).toContain('New Source');
    });

    it('does not render the New Source button when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(SourcesHelper.render(false, 0, buildHandlers()));
      expect(html).not.toContain('New Source');
    });
  });
});
