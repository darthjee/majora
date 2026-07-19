import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import BrowsePager from '../../../../../../assets/js/components/common/pagination/BrowsePager.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('BrowsePager', function() {
  it('renders nothing when there is only one page', function() {
    const html = renderToStaticMarkup(
      React.createElement(BrowsePager, { browse: { page: 1, pages: 1 }, onPrev: Noop.noop, onNext: Noop.noop })
    );
    expect(html).toBe('');
  });

  it('renders nothing when there are no pages', function() {
    const html = renderToStaticMarkup(
      React.createElement(BrowsePager, { browse: { page: 1, pages: 0 }, onPrev: Noop.noop, onNext: Noop.noop })
    );
    expect(html).toBe('');
  });

  it('renders the current page and total pages', function() {
    const html = renderToStaticMarkup(
      React.createElement(BrowsePager, { browse: { page: 2, pages: 5 }, onPrev: Noop.noop, onNext: Noop.noop })
    );
    expect(html).toContain('2 / 5');
  });

  it('disables the previous button on the first page', function() {
    const html = renderToStaticMarkup(
      React.createElement(BrowsePager, { browse: { page: 1, pages: 3 }, onPrev: Noop.noop, onNext: Noop.noop })
    );
    expect(html).toContain('disabled');
  });

  it('renders both buttons enabled on a middle page', function() {
    const html = renderToStaticMarkup(
      React.createElement(BrowsePager, { browse: { page: 2, pages: 3 }, onPrev: Noop.noop, onNext: Noop.noop })
    );
    expect(html).not.toContain('disabled');
  });
});
