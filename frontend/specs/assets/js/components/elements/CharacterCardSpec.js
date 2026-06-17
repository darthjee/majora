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

  it('renders the normal size by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, { character, gameSlug: 'epic-quest', characterType: 'pc' })
    );
    expect(html).toContain('col-sm-6 col-md-4 col-lg-3');
    expect(html).toContain('<h5');
  });

  it('renders the small size when requested', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        CharacterCard, { character, gameSlug: 'epic-quest', characterType: 'pc', size: 'small' },
      )
    );
    expect(html).toContain('col-sm-4 col-md-3 col-lg-2');
    expect(html).toContain('<h6');
  });
});
