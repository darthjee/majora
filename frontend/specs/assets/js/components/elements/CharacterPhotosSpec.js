import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPhotos from '../../../../../assets/js/components/elements/CharacterPhotos.jsx';

describe('CharacterPhotos', function() {
  const photos = [
    { id: 1, url: 'http://example.com/photo1.png' },
    { id: 2, url: 'http://example.com/photo2.png' },
  ];

  it('renders each photo', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotos, { photos, alt: 'Aragorn' })
    );
    expect(html).toContain('http://example.com/photo1.png');
    expect(html).toContain('http://example.com/photo2.png');
  });

  it('applies alt text to each image', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotos, { photos, alt: 'Aragorn' })
    );
    expect(html).toContain('alt="Aragorn"');
  });

  it('renders nothing when photos array is empty', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotos, { photos: [], alt: 'Aragorn' })
    );
    expect(html).toBe('');
  });

  it('renders nothing when photos is undefined', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotos, { alt: 'Aragorn' })
    );
    expect(html).toBe('');
  });
});
