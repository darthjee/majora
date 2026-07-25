import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ItemPreviewCard from '../../../../../../assets/js/components/common/cards/ItemPreviewCard.jsx';

describe('ItemPreviewCard', function() {
  it('delegates rendering to ItemPreviewCardHelper', function() {
    const item = {
      id: 1, name: 'Cloak of Elvenkind', description: 'Grants stealth.', photo_path: null,
    };
    const html = renderToStaticMarkup(React.createElement(ItemPreviewCard, { item }));

    expect(html).toContain('alt="Cloak of Elvenkind"');
    expect(html).toContain('default_item.png');
  });

  it('does not render a link when href is not given', function() {
    const item = { id: 1, name: 'Cloak of Elvenkind', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(ItemPreviewCard, { item }));

    expect(html).not.toContain('<a ');
  });

  it('links to the given href when provided', function() {
    const item = { id: 1, name: 'Cloak of Elvenkind', photo_path: null };
    const html = renderToStaticMarkup(
      React.createElement(ItemPreviewCard, { item, href: '#/games/demo/pcs/7/items/1' }),
    );

    expect(html).toContain('href="#/games/demo/pcs/7/items/1"');
  });
});
