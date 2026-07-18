import { renderToStaticMarkup } from 'react-dom/server';
import TreasurePreviewCardHelper
  from '../../../../../../assets/js/components/common/helpers/TreasurePreviewCardHelper.jsx';

describe('TreasurePreviewCardHelper', function() {
  const treasure = {
    id: 42, name: 'Golden Crown', value: 500, photo_path: null,
  };

  describe('.render', function() {
    it('renders the grid-cell column classes matching SeeAllCard', function() {
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(treasure));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('links to the treasure detail page', function() {
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(treasure));
      expect(html).toContain('href="#/treasures/42"');
    });

    it('renders the default treasure image when photo_path is null', function() {
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(treasure));
      expect(html).toContain('<img');
      expect(html).toContain('default_treasure.png');
    });

    it('renders the treasure image when photo_path is provided', function() {
      const t = { ...treasure, photo_path: 'http://example.com/crown.png' };
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(t));
      expect(html).toContain('http://example.com/crown.png');
    });

    it('keeps the treasure name as the image alt text', function() {
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(treasure));
      expect(html).toContain('alt="Golden Crown"');
    });

    it('does not render a card body or the treasure name as visible text', function() {
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(treasure));
      expect(html).not.toContain('card-body');
      expect(html).not.toContain('>Golden Crown<');
    });

    it('does not render the tooltip content on the initial render', function() {
      const html = renderToStaticMarkup(TreasurePreviewCardHelper.render(treasure, 3));
      expect(html).not.toContain('>Golden Crown<');
      expect(html).not.toContain('×3');
    });

    it('feeds the treasure name and quantity to the tooltip content', function() {
      const rendered = TreasurePreviewCardHelper.render(treasure, 3);
      const tooltip = rendered.props.children;
      const content = tooltip.props.content;
      const html = renderToStaticMarkup(content);

      expect(html).toContain('Golden Crown');
      expect(html).toContain('×3');
    });

    it('omits the quantity suffix from the tooltip content when quantity is 1', function() {
      const rendered = TreasurePreviewCardHelper.render(treasure, 1);
      const html = renderToStaticMarkup(rendered.props.children.props.content);

      expect(html).not.toContain('×1');
    });

    it('renders the tooltip content money value using the given gameType', function() {
      const t = { ...treasure, value: 350, game_type: 'deadlands' };
      const rendered = TreasurePreviewCardHelper.render(t);
      const html = renderToStaticMarkup(rendered.props.children.props.content);

      expect(html).toContain('3 Dollars and 50 Cents');
    });

    it('defaults the tooltip content gameType to dnd when not given', function() {
      const rendered = TreasurePreviewCardHelper.render({ ...treasure, value: 10 });
      const html = renderToStaticMarkup(rendered.props.children.props.content);

      expect(html).toContain('1 SP');
    });
  });
});
