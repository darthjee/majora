import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardPossessionImage from '../../../../../../assets/js/components/common/cards/CardPossessionImage.jsx';

describe('CardPossessionImage', function() {
  it('renders the default possession photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPossessionImage, { alt: 'Old Tavern' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_possession.png');
    expect(html).toContain('alt="Old Tavern"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPossessionImage, {
        url: '/photos/game_possessions/12/photo.png',
        alt: 'Old Tavern',
      })
    );
    expect(html).toContain('src="/photos/game_possessions/12/photo.png"');
    expect(html).not.toContain('default_possession.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPossessionImage, { alt: 'Old Tavern' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPossessionImage, { alt: 'Old Tavern' })
    );
    expect(html).toContain('card-photo-square');
  });
});
