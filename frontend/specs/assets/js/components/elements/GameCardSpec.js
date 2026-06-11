import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import GameCard from '../../../../../assets/js/components/elements/GameCard.jsx';

describe('GameCard', function() {
  const game = { name: 'Dragon Quest', game_slug: 'dragon-quest', photo: null };

  it('renders the game name', function() {
    const html = renderToStaticMarkup(React.createElement(GameCard, { game }));
    expect(html).toContain('Dragon Quest');
  });

  it('links to the game detail page', function() {
    const html = renderToStaticMarkup(React.createElement(GameCard, { game }));
    expect(html).toContain('href="#/games/dragon-quest"');
  });

  it('renders a placeholder when photo is null', function() {
    const html = renderToStaticMarkup(React.createElement(GameCard, { game }));
    expect(html).toContain('No image');
    expect(html).not.toContain('<img');
  });

  it('renders an image when photo is provided', function() {
    const gameWithPhoto = { ...game, photo: 'http://example.com/cover.png' };
    const html = renderToStaticMarkup(React.createElement(GameCard, { game: gameWithPhoto }));
    expect(html).toContain('<img');
    expect(html).toContain('http://example.com/cover.png');
    expect(html).not.toContain('No image');
  });

  it('applies Bootstrap card classes', function() {
    const html = renderToStaticMarkup(React.createElement(GameCard, { game }));
    expect(html).toContain('card');
    expect(html).toContain('card-body');
    expect(html).toContain('card-title');
  });
});
