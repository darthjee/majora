import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TreasurePreviewCard from '../../../../../../assets/js/components/common/cards/TreasurePreviewCard.jsx';
import { buildTreasure } from '../../../../../support/factories.js';

describe('TreasurePreviewCard', function() {
  it('delegates rendering to TreasurePreviewCardHelper', function() {
    const treasure = buildTreasure({ id: 42 });
    const html = renderToStaticMarkup(
      React.createElement(TreasurePreviewCard, { treasure, quantity: 2 })
    );

    expect(html).toContain('alt="Golden Crown"');
    expect(html).toContain('href="#/treasures/42"');
  });
});
