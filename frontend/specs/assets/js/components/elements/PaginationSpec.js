import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Pagination from '../../../../../assets/js/components/elements/Pagination.jsx';

describe('Pagination', function() {
  it('returns empty string when there is only one page', function() {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { currentPage: 1, totalPages: 1, perPage: 10, basePath: '#/games' })
    );
    expect(html).toBe('');
  });

  it('renders pagination nav for multiple pages', function() {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { currentPage: 2, totalPages: 5, perPage: 10, basePath: '#/games' })
    );
    expect(html).toContain('pagination');
  });

  it('forwards extraParams to preserve active filters on links', function() {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, {
        currentPage: 2, totalPages: 5, perPage: 10, basePath: '#/games/demo/npcs',
        extraParams: { slain: 'true' },
      })
    );
    expect(html).toContain('slain=true');
  });
});
