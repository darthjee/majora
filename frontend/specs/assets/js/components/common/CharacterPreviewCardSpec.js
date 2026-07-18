import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPreviewCard from '../../../../../assets/js/components/common/CharacterPreviewCard.jsx';
import { buildCharacter } from '../../../../support/factories.js';

describe('CharacterPreviewCard', function() {
  it('delegates rendering to CharacterPreviewCardHelper', function() {
    const character = buildCharacter({ id: 42, name: 'Aragorn' });
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewCard, { character, gameSlug: 'epic-quest', characterType: 'pc' })
    );

    expect(html).toContain('alt="Aragorn"');
    expect(html).toContain('href="#/games/epic-quest/pcs/42"');
  });

  it('does not render the name tooltip content on the initial render', function() {
    const character = buildCharacter({ id: 42, name: 'Aragorn' });
    const html = renderToStaticMarkup(
      React.createElement(CharacterPreviewCard, { character, gameSlug: 'epic-quest', characterType: 'pc' })
    );

    expect(html).not.toContain('>Aragorn<');
  });
});
