import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LinkIcon from '../../../../../assets/js/components/elements/LinkIcon.jsx';

describe('LinkIcon', function() {
  it('renders the chain icon when linkType is undefined', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, {})
    );
    expect(html).toContain('bi-link-45deg');
  });

  it('renders the chain icon when linkType is an empty string', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: '' })
    );
    expect(html).toContain('bi-link-45deg');
  });

  it('renders the type-specific image when linkType is recognized', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'lootstudio' })
    );
    expect(html).toContain('lootstudio.png');
    expect(html).not.toContain('bi-link-45deg');
  });

  it('renders the chain icon when linkType is unrecognized', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'unknown_type' })
    );
    expect(html).toContain('bi-link-45deg');
  });
});
