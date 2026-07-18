import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PageLink from '../../../../../../assets/js/components/common/pagination/PageLink.jsx';

describe('PageLink', function() {
  it('replaces :page and :perPage placeholders in the template', function() {
    const html = renderToStaticMarkup(
      React.createElement(PageLink, { urlTemplate: '#/games?page=:page&per_page=:perPage', page: 3, perPage: 20 }, '3')
    );
    expect(html).toContain('href="#/games?page=3&amp;per_page=20"');
  });

  it('renders children as link content', function() {
    const html = renderToStaticMarkup(
      React.createElement(PageLink, { urlTemplate: '#/games?page=:page&per_page=:perPage', page: 1, perPage: 10 }, 'Next')
    );
    expect(html).toContain('Next');
  });

  it('includes aria-label when provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(PageLink, { urlTemplate: '#/games?page=:page&per_page=:perPage', page: 2, perPage: 10, ariaLabel: 'Previous' }, '«')
    );
    expect(html).toContain('aria-label="Previous"');
  });

  it('applies page-link class', function() {
    const html = renderToStaticMarkup(
      React.createElement(PageLink, { urlTemplate: '#/games?page=:page&per_page=:perPage', page: 1, perPage: 10 }, '1')
    );
    expect(html).toContain('class="page-link"');
  });
});
