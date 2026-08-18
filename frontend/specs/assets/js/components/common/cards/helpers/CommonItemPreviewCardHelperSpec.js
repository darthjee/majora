import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemPreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/CommonItemPreviewCardHelper.jsx';

describe('CommonItemPreviewCardHelper', function() {
  const commonItem = { id: 1, name: 'Healing Potion', photo_path: null };

  describe('.render', function() {
    it('renders the grid-cell column classes matching PossessionPreviewCard', function() {
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(commonItem));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default common item image when photo_path is null', function() {
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(commonItem));
      expect(html).toContain('<img');
      expect(html).toContain('default_common_item.png');
    });

    it('renders the common item image when photo_path is provided', function() {
      const withPhoto = { ...commonItem, photo_path: 'http://example.com/potion.png' };
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(withPhoto));
      expect(html).toContain('http://example.com/potion.png');
    });

    it('keeps the common item name as the image alt text', function() {
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(commonItem));
      expect(html).toContain('alt="Healing Potion"');
    });

    it('does not render a card body or the common item name as visible text', function() {
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(commonItem));
      expect(html).not.toContain('card-body');
      expect(html).not.toContain('>Healing Potion<');
    });

    it('does not render the tooltip content on the initial render', function() {
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(commonItem));
      expect(html).not.toContain('>Healing Potion<');
    });

    it('feeds only the common item name to the tooltip content', function() {
      const rendered = CommonItemPreviewCardHelper.render(commonItem);
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('Healing Potion');
    });

    it('does not link the card when href is not given', function() {
      const html = renderToStaticMarkup(CommonItemPreviewCardHelper.render(commonItem));
      expect(html).not.toContain('<a ');
    });

    it('links the whole card to href when given', function() {
      const html = renderToStaticMarkup(
        CommonItemPreviewCardHelper.render(commonItem, '#/games/demo/common_items/1'),
      );
      expect(html).toContain('href="#/games/demo/common_items/1"');
    });
  });
});
