import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TreasurePreviewCard from '../../../../../assets/js/components/common/TreasurePreviewCard.jsx';

describe('TreasurePreviewCard', function() {
  it('delegates rendering to TreasurePreviewCardHelper', function() {
    const treasure = {
      id: 42, name: 'Golden Crown', value: 500, photo_path: null,
    };
    const html = renderToStaticMarkup(
      React.createElement(TreasurePreviewCard, { treasure, quantity: 2 })
    );

    expect(html).toContain('alt="Golden Crown"');
    expect(html).toContain('href="#/treasures/42"');
  });
});
