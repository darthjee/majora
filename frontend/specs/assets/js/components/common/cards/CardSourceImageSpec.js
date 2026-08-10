import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardSourceImage from '../../../../../../assets/js/components/common/cards/CardSourceImage.jsx';

describe('CardSourceImage', function() {
  it('renders the default source photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardSourceImage, { alt: 'MyMiniFactory' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_source.png');
    expect(html).toContain('alt="MyMiniFactory"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardSourceImage, {
        url: '/photos/sources/12/photo.png',
        alt: 'MyMiniFactory',
      })
    );
    expect(html).toContain('src="/photos/sources/12/photo.png"');
    expect(html).not.toContain('default_source.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardSourceImage, { alt: 'MyMiniFactory' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardSourceImage, { alt: 'MyMiniFactory' })
    );
    expect(html).toContain('card-photo-square');
  });
});
