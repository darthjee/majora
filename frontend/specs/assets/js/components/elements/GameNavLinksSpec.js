import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import GameNavLinks from '../../../../../assets/js/components/elements/GameNavLinks.jsx';

describe('GameNavLinks', function() {
  it('delegates rendering to GameNavLinksHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameNavLinks, { gameSlug: 'epic-quest' })
    );
    expect(html).toContain('href="#/games/epic-quest/pcs"');
    expect(html).toContain('href="#/games/epic-quest/npcs"');
    expect(html).toContain('href="#/games/epic-quest/players"');
  });
});
