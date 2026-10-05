import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsDomainsTableHelper, { DOMAINS_COLUMNS }
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsDomainsTableHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StatisticsDomainsTableHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.domains.${key}`);
  const both = ['anonymous', 'logged_in'];
  const domainRow = {
    id: 3, domain: 'example.com', group: 'Search', label: 'example.com', anonymous: 1200, logged_in: 34,
    visits: 1234, unique_visitors: 800, average_duration_seconds: 274, median_duration_seconds: 3600,
    loggedInShare: 34 / 1234, unknown: false,
  };
  const unknownRow = {
    id: 'unknown', domain: null, group: null, label: t('unknown'), anonymous: 0, logged_in: 0,
    visits: 0, unique_visitors: 0, average_duration_seconds: null, median_duration_seconds: null,
    loggedInShare: null, unknown: true,
  };
  const noSort = { key: null, direction: 'asc' };
  let handlers;

  beforeEach(function() {
    handlers = {
      onSort: jasmine.createSpy('onSort'),
      onRowClick: jasmine.createSpy('onRowClick'),
      onRowKeyDown: jasmine.createSpy('onRowKeyDown'),
    };
  });

  const element = (state) => StatisticsDomainsTableHelper.render({ series: both, sort: noSort, ...state }, handlers);
  const render = (state) => renderToStaticMarkup(element(state));
  const findAll = (node, predicate, found = []) => {
    if (!node || typeof node !== 'object') return found;
    if (Array.isArray(node)) {
      node.forEach((child) => findAll(child, predicate, found));
      return found;
    }
    if (predicate(node)) found.push(node);
    findAll(node.props?.children, predicate, found);
    return found;
  };

  it('renders the table test id and every header with both series', function() {
    const html = render({ rows: [domainRow] });

    expect(html).toContain('data-testid="statistics-domains-table"');
    expect(html).toContain('table-hover');
    expect(html).toContain('table-responsive');
    DOMAINS_COLUMNS.forEach(({ labelKey }) => expect(html).toContain(t(labelKey)));
  });

  it('renders the domain row values', function() {
    const html = render({ rows: [domainRow] });

    expect(html).toContain('<td>example.com</td>');
    expect(html).toContain('<td>Search</td>');
    expect(html).toContain(`<td>${StatisticsBucketFormatter.count(1234)}</td>`);
    expect(html).toContain(`<td>${StatisticsBucketFormatter.count(1200)}</td>`);
    expect(html).toContain('<td>34</td>');
    expect(html).toContain('<td>800</td>');
    expect(html).toContain('<td>4m 34s</td>');
    expect(html).toContain('<td>1h 0m</td>');
  });

  it('renders the unknown row label, a dash group and dash durations', function() {
    const html = render({ rows: [unknownRow] });

    expect(html).toContain(`<td>${t('unknown')}</td>`);
    expect((html.match(/<td>—<\/td>/g) || []).length).toBe(3);
  });

  it('renders the rows as keyboard accessible links', function() {
    const html = render({ rows: [domainRow, unknownRow] });

    expect(html).toContain('role="link"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('data-testid="statistics-domains-row-3"');
    expect(html).toContain('data-testid="statistics-domains-row-unknown"');
  });

  it('renders no rows for an empty list', function() {
    expect(render({ rows: [] })).not.toContain('role="link"');
  });

  it('hides the logged-in column for the anonymous audience', function() {
    const html = render({ rows: [domainRow], series: ['anonymous'] });

    expect(html).toContain(t('anonymous'));
    expect(html).not.toContain(t('logged_in'));
    expect(html).not.toContain('<td>34</td>');
  });

  it('hides the anonymous column for the logged_in audience', function() {
    const html = render({ rows: [domainRow], series: ['logged_in'] });

    expect(html).not.toContain(t('anonymous'));
    expect(html).toContain(t('logged_in'));
  });

  it('marks no header as sorted by default', function() {
    const html = render({ rows: [domainRow] });

    expect(html).not.toContain('aria-sort="ascending"');
    expect(html).not.toContain('aria-sort="descending"');
    expect(html).not.toContain('▲');
  });

  it('marks the ascending sorted header', function() {
    const html = render({ rows: [domainRow], sort: { key: 'visits', direction: 'asc' } });

    expect(html).toContain('aria-sort="ascending"');
    expect(html).toContain('▲');
    expect(html).toContain(t('sort_ascending'));
  });

  it('marks the descending sorted header', function() {
    const html = render({ rows: [domainRow], sort: { key: 'visits', direction: 'desc' } });

    expect(html).toContain('aria-sort="descending"');
    expect(html).toContain('▼');
    expect(html).toContain(t('sort_descending'));
  });

  describe('handlers', function() {
    const buttons = (tree) => findAll(tree, (node) => node.type === 'button');
    const rowsOf = (tree) => findAll(tree, (node) => node.props?.role === 'link');

    it('calls onSort with the column key on header click', function() {
      const [first, second] = buttons(element({ rows: [domainRow] }));
      first.props.onClick();
      second.props.onClick();

      expect(handlers.onSort.calls.allArgs()).toEqual([['label'], ['group']]);
    });

    it('calls onRowClick and onRowKeyDown with the row', function() {
      const [row] = rowsOf(element({ rows: [domainRow] }));
      const event = { key: 'Enter' };
      row.props.onClick();
      row.props.onKeyDown(event);

      expect(handlers.onRowClick).toHaveBeenCalledWith(domainRow);
      expect(handlers.onRowKeyDown).toHaveBeenCalledWith(event, domainRow);
    });
  });

  describe('.visibleColumns', function() {
    it('keeps every column with both series', function() {
      expect(StatisticsDomainsTableHelper.visibleColumns(both).length).toBe(DOMAINS_COLUMNS.length);
    });

    it('drops the hidden series column', function() {
      expect(StatisticsDomainsTableHelper.visibleColumns(['logged_in']).map(({ key }) => key)).toEqual([
        'label', 'group', 'visits', 'logged_in', 'unique_visitors',
        'average_duration_seconds', 'median_duration_seconds',
      ]);
    });
  });

  it('is a valid React element', function() {
    expect(React.isValidElement(element({ rows: [] }))).toBeTrue();
  });
});
