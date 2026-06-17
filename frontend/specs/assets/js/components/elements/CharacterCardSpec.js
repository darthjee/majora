import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterCard from '../../../../../assets/js/components/elements/CharacterCard.jsx';

describe('CharacterCard', function() {
  const character = { id: 42, name: 'Aragorn', avatar_url: null };

  it('delegates rendering to CharacterCardHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, { character, gameSlug: 'epic-quest', characterType: 'pc' })
    );
    expect(html).toContain('Aragorn');
    expect(html).toContain('href="#/games/epic-quest/pcs/42"');
  });
});
