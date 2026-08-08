import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import StlModelPhotoField
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/elements/StlModelPhotoField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('StlModelPhotoField', function() {
  it('renders the default STL model placeholder when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(StlModelPhotoField, { alt: 'New STL Model', onClick: Noop.noop })
    );
    expect(html).toContain('default_stl_model.png');
  });

  it('renders the given local preview url when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(StlModelPhotoField, {
        url: 'blob:http://example.com/preview', alt: 'New STL Model', onClick: Noop.noop,
      })
    );
    expect(html).toContain('blob:http://example.com/preview');
  });

  it('always renders the upload button', function() {
    const html = renderToStaticMarkup(
      React.createElement(StlModelPhotoField, { alt: 'New STL Model', onClick: Noop.noop })
    );
    expect(html).toContain('actions-overlay-button');
  });
});
