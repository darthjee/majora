import { renderToStaticMarkup } from 'react-dom/server';
import TreasurePreviewSectionHelper
  from '../../../../../../assets/js/components/elements/helpers/TreasurePreviewSectionHelper.jsx';

describe('TreasurePreviewSectionHelper', function() {
  const title = 'Treasures';
  const seeAllHref = '#/games/epic-quest/pcs/1/treasures';

  const buildTreasures = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Treasure ${index + 1}`,
    quantity: index + 1,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(TreasurePreviewSectionHelper.render(buildTreasures(2), title, seeAllHref));
      expect(html).toContain('Treasures');
    });

    it('renders a row for each treasure when within the preview limit', function() {
      const html = renderToStaticMarkup(TreasurePreviewSectionHelper.render(buildTreasures(3), title, seeAllHref));
      expect(html).toContain('Treasure 1');
      expect(html).toContain('Treasure 2');
      expect(html).toContain('Treasure 3');
    });

    it('renders each treasure quantity', function() {
      const html = renderToStaticMarkup(
        TreasurePreviewSectionHelper.render([{ id: 1, name: 'Potion', quantity: 5 }], title, seeAllHref)
      );
      expect(html).toContain('>5<');
    });

    it('slices the treasures to the max preview count', function() {
      const html = renderToStaticMarkup(TreasurePreviewSectionHelper.render(buildTreasures(14), title, seeAllHref));
      expect(html).toContain('Treasure 12');
      expect(html).not.toContain('Treasure 13');
      expect(html).not.toContain('Treasure 14');
    });

    it('renders a see all link with the provided href', function() {
      const html = renderToStaticMarkup(TreasurePreviewSectionHelper.render(buildTreasures(1), title, seeAllHref));
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('See all Treasures');
    });

    it('renders an empty list when there are no treasures', function() {
      const html = renderToStaticMarkup(TreasurePreviewSectionHelper.render([], title, seeAllHref));
      expect(html).toContain('Treasures');
      expect(html).toContain(`href="${seeAllHref}"`);
    });
  });
});
