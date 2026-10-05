import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsVisitListTable
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StatisticsVisitListTable.jsx';

describe('StatisticsVisitListTable', function() {
  const row = (id, user) => ({
    id, startedAt: '2026-01-07T10:00:00Z', lastSeenAt: '2026-01-07T10:05:00Z', durationSeconds: 300,
    hits: 4, ongoing: false, ip: '10.0.0.1', domain: 'example.com', sessionId: `s${id}`, user,
  });
  const rows = [row(5, null), row(3, { id: 1, name: 'ana', displayName: null, email: 'ana@example.com' })];
  const filters = { range: '7d', granularity: 'auto', audience: 'all' };

  const render = (props = {}) => renderToStaticMarkup(React.createElement(StatisticsVisitListTable, {
    rows, sort: 'started_at', filters, ...props,
  }));

  it('renders the rows in API order', function() {
    const html = render();

    expect(html.indexOf('statistics-visit-list-row-5')).toBeGreaterThan(-1);
    expect(html.indexOf('statistics-visit-list-row-5')).toBeLessThan(html.indexOf('statistics-visit-list-row-3'));
  });

  it('marks the current sort header', function() {
    expect(render({ sort: 'last_seen' })).toContain('aria-sort="descending"');
  });

  it('renders the sort links with the filters', function() {
    expect(render()).toContain('href="#/staff/statistics/visit-list?range=7d&amp;sort=hits"');
  });

  it('renders rows that are not links', function() {
    expect(render()).not.toContain('role="link"');
  });

  it('renders an empty table without rows', function() {
    expect(render({ rows: [] })).toContain('data-testid="statistics-visit-list-table"');
  });
});
