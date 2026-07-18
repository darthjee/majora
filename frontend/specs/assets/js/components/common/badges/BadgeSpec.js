import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Badge from '../../../../../../assets/js/components/common/badges/Badge.jsx';

describe('Badge', function() {
  it('renders the given text', function() {
    const html = renderToStaticMarkup(React.createElement(Badge, { text: '×5' }));

    expect(html).toContain('×5');
  });

  it('renders no icon when icon is omitted', function() {
    const html = renderToStaticMarkup(React.createElement(Badge, { text: '×5' }));

    expect(html).not.toContain('<i');
  });

  it('renders the given icon', function() {
    const html = renderToStaticMarkup(React.createElement(Badge, { icon: 'bi-info-circle-fill' }));

    expect(html).toContain('bi-info-circle-fill');
    expect(html).toContain('<i');
  });

  it('defaults to the secondary color variant', function() {
    const html = renderToStaticMarkup(React.createElement(Badge, { text: '×5' }));

    expect(html).toContain('bg-secondary');
  });

  it('applies the given color variant', function() {
    const html = renderToStaticMarkup(React.createElement(Badge, { text: 'Enemy', variant: 'danger' }));

    expect(html).toContain('bg-danger');
  });

  it('applies the badge class', function() {
    const html = renderToStaticMarkup(React.createElement(Badge, { text: '×5' }));

    expect(html).toContain('badge');
  });
});
