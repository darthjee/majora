import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardAvatar from '../../../../../assets/js/components/elements/CardAvatar.jsx';

describe('CardAvatar', function() {
  it('renders an img element when a URL is provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { url: 'http://example.com/avatar.png', alt: 'Hero' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('http://example.com/avatar.png');
    expect(html).toContain('alt="Hero"');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { url: 'http://example.com/avatar.png', alt: 'Hero' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { url: 'http://example.com/avatar.png', alt: 'Hero' })
    );
    expect(html).toContain('card-photo-square');
  });

  it('renders the default character photo when url is null', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { url: null, alt: 'Hero' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_character.png');
    expect(html).not.toContain('No image');
  });

  it('renders the default character photo when url is undefined', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { alt: 'Hero' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_character.png');
  });

  it('applies the card-img-top class to the default photo', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { url: null, alt: 'Hero' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the default photo in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardAvatar, { url: null, alt: 'Hero' })
    );
    expect(html).toContain('card-photo-square');
  });
});
