import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardItemImage from '../../../../../../assets/js/components/common/cards/CardItemImage.jsx';

describe('CardItemImage', function() {
  it('renders the default item photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardItemImage, { alt: 'Cloak of Elvenkind' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_item.png');
    expect(html).toContain('alt="Cloak of Elvenkind"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardItemImage, {
        url: '/photos/game_items/12/photo.png',
        alt: 'Cloak of Elvenkind',
      })
    );
    expect(html).toContain('src="/photos/game_items/12/photo.png"');
    expect(html).not.toContain('default_item.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardItemImage, { alt: 'Cloak of Elvenkind' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardItemImage, { alt: 'Cloak of Elvenkind' })
    );
    expect(html).toContain('card-photo-square');
  });
});
