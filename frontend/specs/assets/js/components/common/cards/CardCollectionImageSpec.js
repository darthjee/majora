import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardCollectionImage from '../../../../../../assets/js/components/common/cards/CardCollectionImage.jsx';

describe('CardCollectionImage', function() {
  it('renders the default collection photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCollectionImage, { alt: 'Goblin Pack' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_collection.png');
    expect(html).toContain('alt="Goblin Pack"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCollectionImage, {
        url: '/photos/collections/12/photo.png',
        alt: 'Goblin Pack',
      })
    );
    expect(html).toContain('src="/photos/collections/12/photo.png"');
    expect(html).not.toContain('default_collection.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCollectionImage, { alt: 'Goblin Pack' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCollectionImage, { alt: 'Goblin Pack' })
    );
    expect(html).toContain('card-photo-square');
  });
});
