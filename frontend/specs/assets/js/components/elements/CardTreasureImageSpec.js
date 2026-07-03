import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardTreasureImage from '../../../../../assets/js/components/elements/CardTreasureImage.jsx';

describe('CardTreasureImage', function() {
  it('renders the default treasure photo with the given alt text', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardTreasureImage, { alt: 'Golden Crown' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_treasure.png');
    expect(html).toContain('alt="Golden Crown"');
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
