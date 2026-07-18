import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LoadMoreButton from '../../../../../../assets/js/components/common/buttons/LoadMoreButton.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('LoadMoreButton', function() {
  it('renders nothing when visible is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadMoreButton, {
        visible: false, loading: false, onClick: Noop.noop, label: 'Load more',
      })
    );
    expect(html).toBe('');
  });

  it('renders the button when visible is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadMoreButton, {
        visible: true, loading: false, onClick: Noop.noop, label: 'Load more',
      })
    );
    expect(html).toContain('<button');
    expect(html).toContain('Load more');
  });

  it('is not disabled when loading is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadMoreButton, {
        visible: true, loading: false, onClick: Noop.noop, label: 'Load more',
      })
    );
    expect(html).not.toContain('disabled');
  });

  it('is disabled while loading is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadMoreButton, {
        visible: true, loading: true, onClick: Noop.noop, label: 'Load more',
      })
    );
    expect(html).toContain('disabled=""');
  });
});
