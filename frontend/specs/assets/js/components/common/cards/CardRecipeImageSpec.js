import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardRecipeImage from '../../../../../../assets/js/components/common/cards/CardRecipeImage.jsx';

describe('CardRecipeImage', function() {
  it('renders the common item placeholder with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardRecipeImage, { alt: 'Healing Potion' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_common_item.png');
    expect(html).toContain('alt="Healing Potion"');
  });

  it('renders the provided url (the output photo) instead of the placeholder when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardRecipeImage, {
        url: '/photos/game_recipes/12/photo.png',
        alt: 'Healing Potion',
      })
    );
    expect(html).toContain('src="/photos/game_recipes/12/photo.png"');
    expect(html).not.toContain('default_common_item.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardRecipeImage, { alt: 'Healing Potion' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardRecipeImage, { alt: 'Healing Potion' })
    );
    expect(html).toContain('card-photo-square');
  });
});
