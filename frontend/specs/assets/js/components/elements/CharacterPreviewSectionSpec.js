import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPreviewSection from '../../../../../assets/js/components/elements/CharacterPreviewSection.jsx';

describe('CharacterPreviewSection', function() {
  const characters = [
    { id: 1, name: 'Aragorn', profile_photo_path: null },
    { id: 2, name: 'Legolas', profile_photo_path: null },
  ];

  it('delegates rendering to CharacterPreviewSectionHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewSection, {
        characters,
        gameSlug: 'epic-quest',
        characterType: 'pc',
        title: 'Player Characters',
        seeAllHref: '#/games/epic-quest/pcs',
      })
    );
    expect(html).toContain('Player Characters');
    expect(html).toContain('Aragorn');
    expect(html).toContain('Legolas');
    expect(html).toContain('href="#/games/epic-quest/pcs"');
  });
});
