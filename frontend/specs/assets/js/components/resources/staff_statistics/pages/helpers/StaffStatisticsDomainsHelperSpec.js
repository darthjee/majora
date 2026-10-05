import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsDomainsHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsDomainsHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import StatisticsDurationFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsDomainsHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.domains.${key}`);
  const filters = { range: '30d', granularity: 'auto', audience: 'all' };
  const totalsFor = (overrides = {}) => ({
    visits: 1234, anonymous: 1000, logged_in: 234, unique_visitors: 800,
    average_duration_seconds: 274, median_duration_seconds: 90, ...overrides,
  });
  const zeroTotals = () => totalsFor({
    visits: 0, anonymous: 0, logged_in: 0, unique_visitors: 0,
    average_duration_seconds: null, median_duration_seconds: null,
  });
  const rowFor = (id, label, overrides = {}) => ({
    id, domain: label, group: 'Group', label, anonymous: 1000, logged_in: 234, visits: 1234,
    unique_visitors: 800, average_duration_seconds: 274, median_duration_seconds: 90,
    loggedInShare: 234 / 1234, unknown: false, ...overrides,
  });
  const dataFor = (overrides = {}) => ({
    domains: [rowFor(3, 'example.com')],
    totals: totalsFor(),
    series: ['anonymous', 'logged_in'],
    audience: 'all',
    filters: {},
    empty: false,
    noRows: false,
    ...overrides,
  });
  const valueOf = (html, key) => {
    const marker = `data-testid="statistics-domains-${key}-value">`;
    const start = html.indexOf(marker) + marker.length;

    return html.slice(start, html.indexOf('<', start));
  };

  describe('.render', function() {
    const render = (data) => renderToStaticMarkup(StaffStatisticsDomainsHelper.render(data, filters));

    it('renders the section and the title', function() {
      const html = render(dataFor());

      expect(html).toContain('data-testid="statistics-domains"');
      expect(html).toContain(t('title'));
    });

    it('renders the totals tiles', function() {
      const html = render(dataFor());

      expect(valueOf(html, 'visits')).toBe(StatisticsBucketFormatter.count(1234));
      expect(valueOf(html, 'anonymous')).toBe(StatisticsBucketFormatter.count(1000));
      expect(valueOf(html, 'logged_in')).toBe(StatisticsBucketFormatter.count(234));
      expect(valueOf(html, 'unique_visitors')).toBe(StatisticsBucketFormatter.count(800));
      expect(valueOf(html, 'average_duration')).toBe(StatisticsDurationFormatter.format(274));
      expect(valueOf(html, 'median_duration')).toBe(StatisticsDurationFormatter.format(90));
    });

    it('hides the logged-in tile for the anonymous audience', function() {
      const html = render(dataFor({ series: ['anonymous'], audience: 'anonymous' }));

      expect(html).toContain('data-testid="statistics-domains-anonymous"');
      expect(html).not.toContain('data-testid="statistics-domains-logged_in"');
    });

    it('hides the anonymous tile for the logged_in audience', function() {
      const html = render(dataFor({ series: ['logged_in'], audience: 'logged_in' }));

      expect(html).not.toContain('data-testid="statistics-domains-anonymous"');
      expect(html).toContain('data-testid="statistics-domains-logged_in"');
    });

    it('renders the chart title and the table with visits, without the empty note', function() {
      const html = render(dataFor());

      expect(html).not.toContain('data-testid="statistics-domains-empty"');
      expect(html).toContain(t('chart'));
      expect(html).toContain('data-testid="statistics-domains-table"');
      expect(html).toContain('data-testid="statistics-domains-row-3"');
    });

    it('renders the empty note and still the chart and table with zero rows', function() {
      const html = render(dataFor({
        domains: [rowFor('unknown', t('unknown'), {
          domain: null, group: null, anonymous: 0, logged_in: 0, visits: 0, unique_visitors: 0,
          average_duration_seconds: null, median_duration_seconds: null, loggedInShare: null, unknown: true,
        })],
        totals: zeroTotals(),
        empty: true,
      }));

      expect(html).toContain('data-testid="statistics-domains-empty"');
      expect(html).toContain(t('empty'));
      expect(html).toContain(t('chart'));
      expect(html).toContain('data-testid="statistics-domains-row-unknown"');
      expect(valueOf(html, 'average_duration')).toBe('—');
      expect(valueOf(html, 'median_duration')).toBe('—');
    });

    it('renders only the empty note without rows', function() {
      const html = render(dataFor({
        domains: [], totals: zeroTotals(), empty: true, noRows: true,
      }));

      expect(html).toContain('data-testid="statistics-domains-empty"');
      expect(html).not.toContain(t('chart'));
      expect(html).not.toContain('data-testid="statistics-domains-table"');
    });

    it('renders the chart loading fallback or the lazily loaded chart', function() {
      const html = render(dataFor());
      const showsFallback = html.includes(Translator.t('staff_statistics_page.charts_loading'));
      const showsChart = html.includes('data-testid="statistics-domains-chart"');

      // The lazy charts chunk is cached once resolved, so either state is valid here.
      expect(showsFallback || showsChart).toBeTrue();
    });
  });

  describe('.renderState', function() {
    const render = (state) => renderToStaticMarkup(StaffStatisticsDomainsHelper.renderState(state, filters));

    it('renders the loading message while loading', function() {
      const html = render({ data: null, loading: true, error: null });

      expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
      expect(html).not.toContain(t('title'));
    });

    it('renders the error alert on failure', function() {
      const html = render({ data: null, loading: false, error: t('load_error') });

      expect(html).toContain('alert-danger');
      expect(html).toContain(t('load_error'));
    });

    it('renders the data once loaded', function() {
      expect(render({ data: dataFor(), loading: false, error: null })).toContain(t('title'));
    });
  });
});
