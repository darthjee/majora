import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TreasurePreviewSection from '../../../../../assets/js/components/elements/TreasurePreviewSection.jsx';

describe('TreasurePreviewSection', function() {
  const treasures = [
    { id: 1, name: 'Potion of Healing', quantity: 3 },
    { id: 2, name: 'Golden Crown', quantity: 1 },
  ];

  it('delegates rendering to TreasurePreviewSectionHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasurePreviewSection, {
        treasures,
        title: 'Treasures',
        seeAllHref: '#/games/epic-quest/pcs/1/treasures',
      })
    );
    expect(html).toContain('Treasures');
    expect(html).toContain('Potion of Healing');
    expect(html).toContain('Golden Crown');
    expect(html).toContain('href="#/games/epic-quest/pcs/1/treasures"');
  });
});
