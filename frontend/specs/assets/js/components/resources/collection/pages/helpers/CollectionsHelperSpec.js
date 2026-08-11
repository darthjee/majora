import { renderToStaticMarkup } from 'react-dom/server';
import CollectionsHelper
  from '../../../../../../../../assets/js/components/resources/collection/pages/helpers/CollectionsHelper.jsx';

describe('CollectionsHelper', function() {
  const buildHandlers = () => ({ onNewClick: jasmine.createSpy('onNewClick') });

  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(CollectionsHelper.render(false, 0, buildHandlers()));
      expect(html).toContain('href="#/"');
    });

    it('renders the shared ListPage grid for the collections list type', function() {
      const html = renderToStaticMarkup(CollectionsHelper.render(false, 0, buildHandlers()));
      expect(html).toContain('container');
    });

    it('renders the New Collection button when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(CollectionsHelper.render(true, 0, buildHandlers()));
      expect(html).toContain('New Collection');
    });

    it('does not render the New Collection button when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(CollectionsHelper.render(false, 0, buildHandlers()));
      expect(html).not.toContain('New Collection');
    });
  });
});
