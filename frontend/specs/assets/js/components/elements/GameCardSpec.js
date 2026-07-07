import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import GameCard from '../../../../../assets/js/components/elements/GameCard.jsx';
import { buildGame } from '../../../../support/factories.js';

describe('GameCard', function() {
  const game = buildGame({ name: 'Dragon Quest', game_slug: 'dragon-quest', cover_photo_path: null });

  it('delegates rendering to GameCardHelper', function() {
    const html = renderToStaticMarkup(React.createElement(GameCard, { game }));
    expect(html).toContain('Dragon Quest');
    expect(html).toContain('href="#/games/dragon-quest"');
  });
});
