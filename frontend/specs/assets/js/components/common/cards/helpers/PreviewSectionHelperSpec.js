import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PreviewSectionHelper from '../../../../../../../assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx';
import Icons from '../../../../../../../assets/js/utils/ui/Icons.js';

describe('PreviewSectionHelper', function() {
  const title = 'Treasures';
  const seeAllHref = '#/games/epic-quest/pcs/1/treasures';
  const icon = Icons.gem;
  const maxItems = 5;
  const renderItem = (item) => React.createElement('span', { key: item.id }, item.name);
  const onToggle = jasmine.createSpy('onToggle');

  const buildItems = (count) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
  }));

  const render = (items, overrides = {}) => {
    const options = {
      emptyText: undefined,
      loading: false,
      total: items.length,
      collapsed: false,
      ...overrides,
    };

    return renderToStaticMarkup(
      PreviewSectionHelper.render(
        items, title, { href: seeAllHref, icon }, maxItems, renderItem, options.emptyText,
        { loading: options.loading, total: options.total, collapsed: options.collapsed }, onToggle,
      )
    );
  };

  describe('.render', function() {
    it('renders the title as a heading with the total count', function() {
      const html = render(buildItems(2), { total: 2 });
      expect(html).toContain('Treasures (2)');
    });

    it('renders "loading" in place of the count while loading', function() {
      const html = render(buildItems(0), { loading: true });
      expect(html).toContain('Treasures (loading)');
    });

    it('renders an item for each entry when within the preview limit', function() {
      const html = render(buildItems(3));
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
      expect(html).toContain('Item 3');
    });

    it('slices the items to maxItems', function() {
      const html = render(buildItems(8));
      expect(html).toContain('Item 5');
      expect(html).not.toContain('Item 6');
      expect(html).not.toContain('Item 7');
      expect(html).not.toContain('Item 8');
    });

    it('renders the see all card with the provided href and icon when expanded', function() {
      const html = render(buildItems(1));
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain(icon);
    });

    it('does not render an empty-state message when emptyText is not given', function() {
      const html = render([]);
      expect(html).toContain('Treasures');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('renders the emptyText message when there are no items', function() {
      const html = render([], { emptyText: 'No treasures yet.' });
      expect(html).toContain('No treasures yet.');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('does not render the emptyText message when there are items', function() {
      const html = render(buildItems(1), { emptyText: 'No treasures yet.' });
      expect(html).not.toContain('No treasures yet.');
    });

    it('hides the body (empty text, item rows, see all card) when collapsed', function() {
      const html = render(buildItems(1), { emptyText: 'No treasures yet.', collapsed: true });
      expect(html).toContain('Treasures (1)');
      expect(html).not.toContain('Item 1');
      expect(html).not.toContain('No treasures yet.');
      expect(html).not.toContain(`href="${seeAllHref}"`);
    });

    it('always renders the title and toggle even while loading, hiding the body', function() {
      const html = render([], { loading: true, collapsed: true });
      expect(html).toContain('Treasures (loading)');
      expect(html).not.toContain(`href="${seeAllHref}"`);
    });

    it('sets aria-expanded to false on the toggle control when collapsed', function() {
      const html = render(buildItems(1), { collapsed: true });
      expect(html).toContain('aria-expanded="false"');
    });

    it('sets aria-expanded to true on the toggle control when expanded', function() {
      const html = render(buildItems(1), { collapsed: false });
      expect(html).toContain('aria-expanded="true"');
    });
  });
});
