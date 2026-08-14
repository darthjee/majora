import { renderToStaticMarkup } from 'react-dom/server';
import FactionPreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/FactionPreviewCardHelper.jsx';

describe('FactionPreviewCardHelper', function() {
  const faction = { id: 1, name: 'The Silver Hand', photo_path: null };

  describe('.render', function() {
    it('renders the grid-cell column classes matching PossessionPreviewCard', function() {
      const html = renderToStaticMarkup(FactionPreviewCardHelper.render(faction));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default faction image when photo_path is null', function() {
      const html = renderToStaticMarkup(FactionPreviewCardHelper.render(faction));
      expect(html).toContain('<img');
      expect(html).toContain('default_faction.png');
    });

    it('renders the faction image when photo_path is provided', function() {
      const withPhoto = { ...faction, photo_path: 'http://example.com/faction.png' };
      const html = renderToStaticMarkup(FactionPreviewCardHelper.render(withPhoto));
      expect(html).toContain('http://example.com/faction.png');
    });

    it('keeps the faction name as the image alt text', function() {
      const html = renderToStaticMarkup(FactionPreviewCardHelper.render(faction));
      expect(html).toContain('alt="The Silver Hand"');
    });

    it('feeds only the faction name to the tooltip content', function() {
      const rendered = FactionPreviewCardHelper.render(faction);
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('The Silver Hand');
    });

    it('does not link the card when href is not given', function() {
      const html = renderToStaticMarkup(FactionPreviewCardHelper.render(faction));
      expect(html).not.toContain('<a ');
    });

    it('links the whole card to href when given', function() {
      const html = renderToStaticMarkup(
        FactionPreviewCardHelper.render(faction, '#/games/demo/factions/9'),
      );
      expect(html).toContain('href="#/games/demo/factions/9"');
    });
  });
});
