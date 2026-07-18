import { renderToStaticMarkup } from 'react-dom/server';
import SeeAllCardHelper from '../../../../../../../assets/js/components/common/cards/helpers/SeeAllCardHelper.jsx';

describe('SeeAllCardHelper', function() {
  describe('.render', function() {
    it('renders the given icon class', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-gem', 'See all Treasures', '#/treasures'));
      expect(html).toContain('bi-gem');
    });

    it('renders a link to href', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-camera-fill', 'See all Photos', '#/photos'));
      expect(html).toContain('href="#/photos"');
    });

    it('renders the grid-cell column classes matching other preview cards', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-gem', 'See all Treasures', '#/treasures'));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('does not render a card body', function() {
      const html = renderToStaticMarkup(SeeAllCardHelper.render('bi-gem', 'See all Treasures', '#/treasures'));
      expect(html).not.toContain('card-body');
    });

    it('feeds the text to the tooltip content', function() {
      const rendered = SeeAllCardHelper.render('bi-gem', 'See all Treasures', '#/treasures');
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('See all Treasures');
    });
  });
});
