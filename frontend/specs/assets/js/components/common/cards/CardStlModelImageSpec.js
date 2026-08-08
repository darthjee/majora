import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardStlModelImage from '../../../../../../assets/js/components/common/cards/CardStlModelImage.jsx';

describe('CardStlModelImage', function() {
  it('renders the default STL model photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardStlModelImage, { alt: 'Goblin Miniature' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_stl_model.png');
    expect(html).toContain('alt="Goblin Miniature"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardStlModelImage, {
        url: '/photos/stl_models/12/photo.png',
        alt: 'Goblin Miniature',
      })
    );
    expect(html).toContain('src="/photos/stl_models/12/photo.png"');
    expect(html).not.toContain('default_stl_model.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardStlModelImage, { alt: 'Goblin Miniature' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardStlModelImage, { alt: 'Goblin Miniature' })
    );
    expect(html).toContain('card-photo-square');
  });
});
