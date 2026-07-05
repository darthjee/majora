import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PhotoCard from '../../../../../assets/js/components/elements/PhotoCard.jsx';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('PhotoCard', function() {
  const photo = { id: 1, path: 'photos/games/demo/photo_ab12.jpg' };

  it('delegates rendering to PhotoCardHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).toContain('photos/games/demo/photo_ab12.jpg');
    expect(html).toContain('alt="Demo Game"');
  });

  it('renders the 6-per-row column classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
  });

  it('renders a clickable button instead of a navigating link', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).toContain('<button');
    expect(html).not.toContain('<a href');
  });
});
