import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CommonItemPreviewCard from '../../../../../../assets/js/components/common/cards/CommonItemPreviewCard.jsx';

describe('CommonItemPreviewCard', function() {
  it('delegates rendering to CommonItemPreviewCardHelper', function() {
    const commonItem = { id: 1, name: 'Healing Potion', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(CommonItemPreviewCard, { commonItem }));

    expect(html).toContain('alt="Healing Potion"');
    expect(html).toContain('default_common_item.png');
  });

  it('does not render a link when href is not given', function() {
    const commonItem = { id: 1, name: 'Healing Potion', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(CommonItemPreviewCard, { commonItem }));

    expect(html).not.toContain('<a ');
  });

  it('links to the given href when provided', function() {
    const commonItem = { id: 1, name: 'Healing Potion', photo_path: null };
    const html = renderToStaticMarkup(
      React.createElement(
        CommonItemPreviewCard,
        { commonItem, href: '#/games/demo/common_items/1' },
      ),
    );

    expect(html).toContain('href="#/games/demo/common_items/1"');
  });
});
