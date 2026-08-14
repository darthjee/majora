import { renderToStaticMarkup } from 'react-dom/server';
import PossessionPreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/PossessionPreviewCardHelper.jsx';

describe('PossessionPreviewCardHelper', function() {
  const possession = { id: 1, name: 'Manor House', photo_path: null };

  describe('.render', function() {
    it('renders the grid-cell column classes matching ItemPreviewCard', function() {
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(possession));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default possession image when photo_path is null', function() {
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(possession));
      expect(html).toContain('<img');
      expect(html).toContain('default_possession.png');
    });

    it('renders the possession image when photo_path is provided', function() {
      const withPhoto = { ...possession, photo_path: 'http://example.com/manor.png' };
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(withPhoto));
      expect(html).toContain('http://example.com/manor.png');
    });

    it('keeps the possession name as the image alt text', function() {
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(possession));
      expect(html).toContain('alt="Manor House"');
    });

    it('does not render a card body or the possession name as visible text', function() {
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(possession));
      expect(html).not.toContain('card-body');
      expect(html).not.toContain('>Manor House<');
    });

    it('does not render the tooltip content on the initial render', function() {
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(possession));
      expect(html).not.toContain('>Manor House<');
    });

    it('feeds only the possession name to the tooltip content', function() {
      const rendered = PossessionPreviewCardHelper.render(possession);
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('Manor House');
    });

    it('does not link the card when href is not given', function() {
      const html = renderToStaticMarkup(PossessionPreviewCardHelper.render(possession));
      expect(html).not.toContain('<a ');
    });

    it('links the whole card to href when given', function() {
      const html = renderToStaticMarkup(
        PossessionPreviewCardHelper.render(possession, '#/games/demo/pcs/7/possessions/1'),
      );
      expect(html).toContain('href="#/games/demo/pcs/7/possessions/1"');
    });
  });
});
