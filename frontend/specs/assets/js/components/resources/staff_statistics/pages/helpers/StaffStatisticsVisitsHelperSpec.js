import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsVisitsHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitsHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsVisitsHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.visits.${key}`);
  const dataFor = (overrides = {}) => ({
    points: [{
      start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
      anonymous: 1200, logged_in: 34, visits: 1234, loggedInShare: 34 / 1234,
    }],
    series: ['anonymous', 'logged_in'],
    totals: { anonymous: 1200, logged_in: 34, visits: 1234 },
    audience: 'all',
    granularity: 'day',
    empty: false,
    ...overrides,
  });
  const totalsOf = (html) => html.match(/<p[^>]*data-testid="statistics-visits-totals"[^>]*>(.*?)<\/p>/)[1];
  const line = (key, value) => `${t(key)}: ${StatisticsBucketFormatter.count(value)}`;

  describe('.render', function() {
    const render = (data) => renderToStaticMarkup(StaffStatisticsVisitsHelper.render(data));

    it('renders the title', function() {
      expect(render(dataFor())).toContain(t('title'));
    });

    it('renders the total and both counts for all visitors', function() {
      const totals = totalsOf(render(dataFor()));

      expect(totals).toContain(line('total', 1234));
      expect(totals).toContain(line('anonymous', 1200));
      expect(totals).toContain(line('logged_in', 34));
    });

    it('renders only the anonymous count for the anonymous audience', function() {
      const totals = totalsOf(render(dataFor({
        series: ['anonymous'], audience: 'anonymous', totals: { anonymous: 1200, logged_in: 0, visits: 1200 },
      })));

      expect(totals).toContain(line('total', 1200));
      expect(totals).toContain(line('anonymous', 1200));
      expect(totals).not.toContain(`${t('logged_in')}:`);
    });

    it('renders only the logged-in count for the logged_in audience', function() {
      const totals = totalsOf(render(dataFor({
        series: ['logged_in'], audience: 'logged_in', totals: { anonymous: 0, logged_in: 34, visits: 34 },
      })));

      expect(totals).toContain(line('total', 34));
      expect(totals).toContain(line('logged_in', 34));
      expect(totals).not.toContain(`${t('anonymous')}:`);
    });

    it('does not render the empty note with visits', function() {
      expect(render(dataFor())).not.toContain('data-testid="statistics-visits-empty"');
    });

    it('renders the empty note and still the chart without visits', function() {
      const html = render(dataFor({ empty: true, totals: { anonymous: 0, logged_in: 0, visits: 0 } }));

      expect(html).toContain('data-testid="statistics-visits-empty"');
      expect(html).toContain(t('empty'));
      expect(html).toContain(line('total', 0));
    });

    it('renders the charts loading fallback or the lazily loaded chart', function() {
      const html = render(dataFor());
      const showsFallback = html.includes(Translator.t('staff_statistics_page.charts_loading'));
      const showsChart = html.includes('data-testid="statistics-visits-chart"');

      // The lazy charts chunk is cached once resolved, so either state is valid here.
      expect(showsFallback || showsChart).toBeTrue();
    });
  });

  describe('.renderState', function() {
    const render = (state) => renderToStaticMarkup(StaffStatisticsVisitsHelper.renderState(state));

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
