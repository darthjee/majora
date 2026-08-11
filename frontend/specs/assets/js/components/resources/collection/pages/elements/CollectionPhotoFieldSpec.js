import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CollectionPhotoField
  from '../../../../../../../../assets/js/components/resources/collection/pages/elements/CollectionPhotoField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CollectionPhotoField', function() {
  it('renders the default collection placeholder when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CollectionPhotoField, { alt: 'New Collection', onClick: Noop.noop })
    );
    expect(html).toContain('default_collection.png');
  });

  it('renders the given local preview url when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CollectionPhotoField, {
        url: 'blob:http://example.com/preview', alt: 'New Collection', onClick: Noop.noop,
      })
    );
    expect(html).toContain('blob:http://example.com/preview');
  });

  it('always renders the upload button', function() {
    const html = renderToStaticMarkup(
      React.createElement(CollectionPhotoField, { alt: 'New Collection', onClick: Noop.noop })
    );
    expect(html).toContain('actions-overlay-button');
  });
});
