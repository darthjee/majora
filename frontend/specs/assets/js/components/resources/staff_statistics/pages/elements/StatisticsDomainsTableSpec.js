import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsDomainsTable
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StatisticsDomainsTable.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StatisticsDomainsTable', function() {
  const t = (key) => Translator.t(`staff_statistics_page.domains.${key}`);
  const row = (id, label, visits, unknown = false) => ({
    id, domain: unknown ? null : label, group: unknown ? null : 'Group', label, anonymous: visits, logged_in: 0,
    visits, unique_visitors: visits, average_duration_seconds: null, median_duration_seconds: null,
    loggedInShare: visits === 0 ? null : 0, unknown,
  });
  const rows = [row(5, 'b.com', 10), row(3, 'a.com', 4), row('unknown', t('unknown'), 20, true)];
  const filters = { range: '30d', granularity: 'auto', audience: 'all' };

  const render = (props = {}) => renderToStaticMarkup(React.createElement(StatisticsDomainsTable, {
    rows, series: ['anonymous', 'logged_in'], filters, ...props,
  }));

  it('renders the rows in API order by default', function() {
    const html = render();
    const order = ['row-5', 'row-3', 'row-unknown'].map((id) => html.indexOf(`statistics-domains-${id}`));

    expect(order.every((index) => index >= 0)).toBeTrue();
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('renders no sorted header by default', function() {
    expect(render()).not.toContain('aria-sort="ascending"');
  });

  it('hides the hidden series column', function() {
    expect(render({ series: ['logged_in'] })).not.toContain(t('anonymous'));
  });

  it('renders an empty table without rows', function() {
    expect(render({ rows: [] })).toContain('data-testid="statistics-domains-table"');
  });
});
