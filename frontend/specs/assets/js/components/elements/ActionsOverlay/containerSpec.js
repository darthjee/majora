import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ActionsOverlay from '../../../../../../assets/js/components/elements/ActionsOverlay.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('ActionsOverlay', function() {
  it('wraps the photo in an actions-overlay container', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('actions-overlay');
  });

  it('does not apply the grayscale class by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
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
      React.createElement(ActionsOverlay, {
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
