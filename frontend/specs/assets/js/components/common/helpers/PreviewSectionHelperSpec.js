import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PreviewSectionHelper from '../../../../../../assets/js/components/common/helpers/PreviewSectionHelper.jsx';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';

describe('PreviewSectionHelper', function() {
  const title = 'Treasures';
  const seeAllHref = '#/games/epic-quest/pcs/1/treasures';
  const icon = Icons.gem;
  const maxItems = 5;
  const renderItem = (item) => React.createElement('span', { key: item.id }, item.name);

  const buildItems = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render(buildItems(2), title, seeAllHref, icon, maxItems, renderItem)
      );
      expect(html).toContain('Treasures');
    });

    it('renders an item for each entry when within the preview limit', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render(buildItems(3), title, seeAllHref, icon, maxItems, renderItem)
      );
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
      expect(html).toContain('Item 3');
    });

    it('slices the items to maxItems', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render(buildItems(8), title, seeAllHref, icon, maxItems, renderItem)
      );
      expect(html).toContain('Item 5');
      expect(html).not.toContain('Item 6');
      expect(html).not.toContain('Item 7');
      expect(html).not.toContain('Item 8');
    });

    it('always renders the see all card with the provided href and icon', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render(buildItems(1), title, seeAllHref, icon, maxItems, renderItem)
      );
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('See all Treasures');
      expect(html).toContain(icon);
    });

    it('does not render an empty-state message when emptyText is not given', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render([], title, seeAllHref, icon, maxItems, renderItem)
      );
      expect(html).toContain('Treasures');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('renders the emptyText message when there are no items', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render([], title, seeAllHref, icon, maxItems, renderItem, 'No treasures yet.')
      );
      expect(html).toContain('No treasures yet.');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('does not render the emptyText message when there are items', function() {
      const html = renderToStaticMarkup(
        PreviewSectionHelper.render(buildItems(1), title, seeAllHref, icon, maxItems, renderItem, 'No treasures yet.')
      );
      expect(html).not.toContain('No treasures yet.');
    });
  });
});
