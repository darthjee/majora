import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardFactionImage from '../../../../../../assets/js/components/common/cards/CardFactionImage.jsx';

describe('CardFactionImage', function() {
  it('renders the default faction photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFactionImage, { alt: 'The Silver Hand' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_faction.png');
    expect(html).toContain('alt="The Silver Hand"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFactionImage, {
        url: '/photos/factions/12/photo.png',
        alt: 'The Silver Hand',
      })
    );
    expect(html).toContain('src="/photos/factions/12/photo.png"');
    expect(html).not.toContain('default_faction.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFactionImage, { alt: 'The Silver Hand' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFactionImage, { alt: 'The Silver Hand' })
    );
    expect(html).toContain('card-photo-square');
  });
});
