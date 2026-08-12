import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FactionPhotoField
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/FactionPhotoField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('FactionPhotoField', function() {
  it('renders the default faction placeholder when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(FactionPhotoField, { alt: 'New Faction', onClick: Noop.noop })
    );
    expect(html).toContain('default_faction.png');
  });

  it('renders the given local preview url when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(FactionPhotoField, {
        url: 'blob:http://example.com/preview', alt: 'New Faction', onClick: Noop.noop,
      })
    );
    expect(html).toContain('blob:http://example.com/preview');
  });

  it('always renders the upload button', function() {
    const html = renderToStaticMarkup(
      React.createElement(FactionPhotoField, { alt: 'New Faction', onClick: Noop.noop })
    );
    expect(html).toContain('actions-overlay-button');
  });
});
