import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PreviewSection from '../../../../../assets/js/components/common/PreviewSection.jsx';
import { MAX_PREVIEW_ITEMS } from '../../../../../assets/js/components/common/characterPreviewConstants.js';
import Icons from '../../../../../assets/js/utils/ui/Icons.js';

describe('PreviewSection', function() {
  const buildItems = (count) => Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
  const renderItem = (item) => React.createElement('span', { key: item.id }, `Item ${item.id}`);

  it('delegates rendering to PreviewSectionHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(PreviewSection, {
        items: buildItems(2),
        title: 'Player Characters',
        seeAllHref: '#/games/epic-quest/pcs',
        icon: Icons.filePerson,
        renderItem,
      })
    );

    expect(html).toContain('Player Characters');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
    expect(html).toContain('href="#/games/epic-quest/pcs"');
  });

  it('defaults maxItems to MAX_PREVIEW_ITEMS', function() {
    const html = renderToStaticMarkup(
      React.createElement(PreviewSection, {
        items: buildItems(MAX_PREVIEW_ITEMS + 2),
        title: 'Player Characters',
        seeAllHref: '#/games/epic-quest/pcs',
        icon: Icons.filePerson,
        renderItem,
      })
    );

    expect(html).toContain(`Item ${MAX_PREVIEW_ITEMS}`);
    expect(html).not.toContain(`Item ${MAX_PREVIEW_ITEMS + 1}`);
  });
});
