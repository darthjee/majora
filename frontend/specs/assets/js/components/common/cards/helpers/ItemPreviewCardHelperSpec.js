import { renderToStaticMarkup } from 'react-dom/server';
import ItemPreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/ItemPreviewCardHelper.jsx';

describe('ItemPreviewCardHelper', function() {
  const item = {
    id: 1, name: 'Cloak of Elvenkind', description: 'Grants stealth.', photo_path: null,
  };

  describe('.render', function() {
    it('renders the grid-cell column classes matching TreasurePreviewCard', function() {
      const html = renderToStaticMarkup(ItemPreviewCardHelper.render(item));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default item image when photo_path is null', function() {
      const html = renderToStaticMarkup(ItemPreviewCardHelper.render(item));
      expect(html).toContain('<img');
      expect(html).toContain('default_item.png');
    });

    it('renders the item image when photo_path is provided', function() {
      const withPhoto = { ...item, photo_path: 'http://example.com/cloak.png' };
      const html = renderToStaticMarkup(ItemPreviewCardHelper.render(withPhoto));
      expect(html).toContain('http://example.com/cloak.png');
    });

    it('keeps the item name as the image alt text', function() {
      const html = renderToStaticMarkup(ItemPreviewCardHelper.render(item));
      expect(html).toContain('alt="Cloak of Elvenkind"');
    });

    it('does not render a card body or the item name as visible text', function() {
      const html = renderToStaticMarkup(ItemPreviewCardHelper.render(item));
      expect(html).not.toContain('card-body');
      expect(html).not.toContain('>Cloak of Elvenkind<');
    });

    it('does not render the tooltip content on the initial render', function() {
      const html = renderToStaticMarkup(ItemPreviewCardHelper.render(item));
      expect(html).not.toContain('>Cloak of Elvenkind<');
      expect(html).not.toContain('Grants stealth.');
    });

    it('feeds only the item name to the tooltip content', function() {
      const rendered = ItemPreviewCardHelper.render(item);
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('Cloak of Elvenkind');
      expect(tooltip.props.content).not.toContain('Grants stealth.');
    });
  });
});
