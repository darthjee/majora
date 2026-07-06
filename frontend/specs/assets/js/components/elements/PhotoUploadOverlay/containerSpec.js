import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PhotoUploadOverlay from '../../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('PhotoUploadOverlay', function() {
  it('wraps the photo in a photo-upload-overlay container', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('photo-upload-overlay');
  });

  it('does not apply the grayscale class by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('photo-grayscale');
  });

  it('applies the grayscale class when grayscale is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
        grayscale: true,
      })
    );

    expect(html).toContain('photo-grayscale');
  });
});
