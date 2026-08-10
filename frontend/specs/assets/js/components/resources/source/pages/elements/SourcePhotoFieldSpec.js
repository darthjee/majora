import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SourcePhotoField
  from '../../../../../../../../assets/js/components/resources/source/pages/elements/SourcePhotoField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('SourcePhotoField', function() {
  it('renders the default source placeholder when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(SourcePhotoField, { alt: 'New Source', onClick: Noop.noop })
    );
    expect(html).toContain('default_source.png');
  });

  it('renders the given local preview url when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(SourcePhotoField, {
        url: 'blob:http://example.com/preview', alt: 'New Source', onClick: Noop.noop,
      })
    );
    expect(html).toContain('blob:http://example.com/preview');
  });

  it('always renders the upload button', function() {
    const html = renderToStaticMarkup(
      React.createElement(SourcePhotoField, { alt: 'New Source', onClick: Noop.noop })
    );
    expect(html).toContain('actions-overlay-button');
  });
});
