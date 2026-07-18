import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LinkIcon from '../../../../../../assets/js/components/common/misc/LinkIcon.jsx';

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

  it('renders the type-specific bootstrap icon when linkType is diary', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'diary' })
    );
    expect(html).toContain('bi-feather');
    expect(html).not.toContain('bi-link-45deg');
  });

  it('renders the type-specific bootstrap icon when linkType is music', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'music' })
    );
    expect(html).toContain('bi-music-note-list');
    expect(html).not.toContain('bi-link-45deg');
  });

  it('renders the type-specific bootstrap icon when linkType is stl', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'stl' })
    );
    expect(html).toContain('bi-box');
    expect(html).not.toContain('bi-link-45deg');
  });

  it('renders the type-specific bootstrap icon when linkType is background', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'background' })
    );
    expect(html).toContain('bi-book-half');
    expect(html).not.toContain('bi-link-45deg');
  });

  it('renders the type-specific bootstrap icon when linkType is reference', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinkIcon, { linkType: 'reference' })
    );
    expect(html).toContain('bi-bookmark-star-fill');
    expect(html).not.toContain('bi-link-45deg');
  });
});
