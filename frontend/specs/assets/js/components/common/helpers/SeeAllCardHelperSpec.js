import { renderToStaticMarkup } from 'react-dom/server';
import SeeAllCardHelper from '../../../../../../assets/js/components/common/helpers/SeeAllCardHelper.jsx';

describe('SeeAllCardHelper', function() {
  describe('.render', function() {
    it('renders the given icon class', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-gem', 'See all Treasures', '#/treasures'));
      expect(html).toContain('bi-gem');
    });

    it('renders the given text as a stretched link to href', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-camera-fill', 'See all Photos', '#/photos'));
      expect(html).toContain('See all Photos');
      expect(html).toContain('href="#/photos"');
      expect(html).toContain('stretched-link');
    });

    it('renders the grid-cell column classes matching other preview cards', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-gem', 'See all Treasures', '#/treasures'));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });
  });
});
