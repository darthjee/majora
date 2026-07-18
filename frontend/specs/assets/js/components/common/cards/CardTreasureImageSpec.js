import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardTreasureImage from '../../../../../../assets/js/components/common/cards/CardTreasureImage.jsx';

describe('CardTreasureImage', function() {
  it('renders the default treasure photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardTreasureImage, { alt: 'Golden Crown' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_treasure.png');
    expect(html).toContain('alt="Golden Crown"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardTreasureImage, {
        url: '/photos/treasures/12/photo.png',
        alt: 'Golden Crown',
      })
    );
    expect(html).toContain('src="/photos/treasures/12/photo.png"');
    expect(html).not.toContain('default_treasure.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardTreasureImage, { alt: 'Golden Crown' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardTreasureImage, { alt: 'Golden Crown' })
    );
    expect(html).toContain('card-photo-square');
  });
});
