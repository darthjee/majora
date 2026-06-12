import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPhoto from '../../../../../assets/js/components/elements/CharacterPhoto.jsx';

describe('CharacterPhoto', function() {
  it('renders the photo image', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhoto, { url: 'http://example.com/photo.png', alt: 'Aragorn' })
    );
    expect(html).toContain('http://example.com/photo.png');
    expect(html).toContain('alt="Aragorn"');
  });

  it('applies img-fluid and rounded classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhoto, { url: 'http://example.com/photo.png', alt: 'Aragorn' })
    );
    expect(html).toContain('img-fluid');
    expect(html).toContain('rounded');
  });
});
