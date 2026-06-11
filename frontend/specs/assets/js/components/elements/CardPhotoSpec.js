import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardPhoto from '../../../../../assets/js/components/elements/CardPhoto.jsx';

describe('CardPhoto', function() {
  it('renders an img element when a URL is provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPhoto, { url: 'http://example.com/cover.png', alt: 'My Game' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('http://example.com/cover.png');
    expect(html).toContain('alt="My Game"');
  });

  it('applies card-img-top and img-fluid classes to the image', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPhoto, { url: 'http://example.com/cover.png', alt: 'My Game' })
    );
    expect(html).toContain('card-img-top');
    expect(html).toContain('img-fluid');
  });

  it('renders the default game photo when url is null', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPhoto, { url: null, alt: 'My Game' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_game.png');
    expect(html).not.toContain('No image');
  });

  it('renders the default game photo when url is undefined', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPhoto, { alt: 'My Game' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_game.png');
    expect(html).not.toContain('No image');
  });

  it('applies card-img-top and img-fluid classes to the default photo', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardPhoto, { url: null, alt: 'My Game' })
    );
    expect(html).toContain('card-img-top');
    expect(html).toContain('img-fluid');
  });
});
