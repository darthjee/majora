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
});
