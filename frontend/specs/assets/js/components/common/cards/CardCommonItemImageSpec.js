import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardCommonItemImage from '../../../../../../assets/js/components/common/cards/CardCommonItemImage.jsx';

describe('CardCommonItemImage', function() {
  it('renders the default common item photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCommonItemImage, { alt: 'Healing Potion' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_common_item.png');
    expect(html).toContain('alt="Healing Potion"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCommonItemImage, {
        url: '/photos/game_common_items/12/photo.png',
        alt: 'Healing Potion',
      })
    );
    expect(html).toContain('src="/photos/game_common_items/12/photo.png"');
    expect(html).not.toContain('default_common_item.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCommonItemImage, { alt: 'Healing Potion' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardCommonItemImage, { alt: 'Healing Potion' })
    );
    expect(html).toContain('card-photo-square');
  });
});
