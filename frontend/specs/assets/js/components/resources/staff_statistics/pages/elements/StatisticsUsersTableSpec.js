import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsUsersTable
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StatisticsUsersTable.jsx';

describe('StatisticsUsersTable', function() {
  const row = (id, name, visits) => ({
    id, name, displayName: null, email: `${name}@example.com`, visits, timeOnSiteSeconds: 60,
    averageDurationSeconds: 30, hits: visits, domains: [], lastSeenAt: '2026-01-07T10:00:00Z',
  });
  const rows = [row(5, 'bob', 10), row(3, 'ana', 4)];
  const filters = { range: '30d', granularity: 'auto', audience: 'all' };

  const render = (props = {}) => renderToStaticMarkup(React.createElement(StatisticsUsersTable, {
    rows, sort: 'visits', filters, ...props,
  }));

  it('renders the rows in API order', function() {
    const html = render();

    expect(html.indexOf('statistics-users-row-5')).toBeGreaterThan(-1);
    expect(html.indexOf('statistics-users-row-5')).toBeLessThan(html.indexOf('statistics-users-row-3'));
  });

  it('marks the current sort header', function() {
    expect(render({ sort: 'last_seen' })).toContain('aria-sort="descending"');
  });

  it('renders the sort links with the filters', function() {
    expect(render()).toContain('href="#/staff/statistics/users?sort=hits"');
  });

  it('renders an empty table without rows', function() {
    expect(render({ rows: [] })).toContain('data-testid="statistics-users-table"');
  });
});
