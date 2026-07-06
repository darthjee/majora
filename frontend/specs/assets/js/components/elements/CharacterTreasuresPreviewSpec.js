import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterTreasuresPreview from '../../../../../assets/js/components/elements/CharacterTreasuresPreview.jsx';

describe('CharacterTreasuresPreview', function() {
  const treasures = [
    { id: 1, treasure_id: 11, name: 'Potion of Healing', quantity: 3, value: 50 },
    { id: 2, treasure_id: 12, name: 'Golden Crown', quantity: 1, value: 500 },
  ];

  it('delegates rendering to CharacterTreasuresPreviewHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterTreasuresPreview, {
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
