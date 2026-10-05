import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsVisitorsHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitorsHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsVisitorsHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.visitors.${key}`);
  const count = (value) => StatisticsBucketFormatter.count(value);
  const totalsFor = (overrides = {}) => ({
    unique_visitors: 1234, new_visitors: 1000, returning_visitors: 234, anonymous: 1200, logged_in: 34,
    ...overrides,
  });
  const zeroTotals = () => totalsFor({
    unique_visitors: 0, new_visitors: 0, returning_visitors: 0, anonymous: 0, logged_in: 0,
  });
  const dataFor = (overrides = {}) => ({
    points: [{
      start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
      unique_visitors: 1234, new_visitors: 1000, returning_visitors: 234, anonymous: 1200, logged_in: 34,
      returningShare: 234 / 1234, loggedInShare: 34 / 1234,
    }],
    audienceSeries: ['anonymous', 'logged_in'],
    totals: totalsFor(),
    audience: 'all',
    granularity: 'day',
    empty: false,
    ...overrides,
  });
  const valueOf = (html, key) => {
    const marker = `data-testid="statistics-visitors-${key}-value">`;
    const start = html.indexOf(marker) + marker.length;

    return html.slice(start, html.indexOf('<', start));
  };

  describe('.render', function() {
    const render = (data) => renderToStaticMarkup(StaffStatisticsVisitorsHelper.render(data));

    it('renders the section and the title', function() {
      const html = render(dataFor());

      expect(html).toContain('data-testid="statistics-visitors"');
      expect(html).toContain(t('title'));
    });

    it('renders the totals tiles for all visitors', function() {
      const html = render(dataFor());

      expect(valueOf(html, 'unique_visitors')).toBe(count(1234));
      expect(valueOf(html, 'new')).toBe(count(1000));
      expect(valueOf(html, 'returning')).toBe(count(234));
      expect(valueOf(html, 'anonymous')).toBe(count(1200));
      expect(valueOf(html, 'logged_in')).toBe(count(34));
      expect(html).toContain(t('unique_visitors'));
    });

    it('renders the tiles without links', function() {
      const html = render(dataFor());

      expect(html).not.toContain('<a');
      expect(html).not.toContain('stretched-link');
    });

    it('renders the returning share on the returning tile', function() {
      expect(render(dataFor())).toContain(
        `${t('returning_share')}: ${StatisticsBucketFormatter.percent(234 / 1234)}`,
      );
    });

    it('hides the returning share without visitors', function() {
      const html = render(dataFor({ empty: true, totals: zeroTotals() }));

      expect(html).not.toContain('data-testid="statistics-visitors-returning-share"');
      expect(valueOf(html, 'unique_visitors')).toBe(count(0));
    });

    it('renders only the anonymous tile for the anonymous audience', function() {
      const html = render(dataFor({ audienceSeries: ['anonymous'], audience: 'anonymous' }));

      expect(valueOf(html, 'anonymous')).toBe(count(1200));
      expect(html).not.toContain('data-testid="statistics-visitors-logged_in"');
    });

    it('renders only the logged-in tile for the logged_in audience', function() {
      const html = render(dataFor({ audienceSeries: ['logged_in'], audience: 'logged_in' }));

      expect(valueOf(html, 'logged_in')).toBe(count(34));
      expect(html).not.toContain('data-testid="statistics-visitors-anonymous"');
    });

    it('renders the totals and first visit notes', function() {
      const html = render(dataFor());

      expect(html).toContain('data-testid="statistics-visitors-totals-note"');
      expect(html).toContain('data-testid="statistics-visitors-first-visit-note"');
    });

    it('does not render the empty note with visitors', function() {
      expect(render(dataFor())).not.toContain('data-testid="statistics-visitors-empty"');
    });

    it('renders the empty note and still both chart titles without visitors', function() {
      const html = render(dataFor({ empty: true, totals: zeroTotals() }));

      expect(html).toContain('data-testid="statistics-visitors-empty"');
      expect(html).toContain(t('empty'));
      expect(html).toContain(t('new_returning_title'));
      expect(html).toContain(t('audience_title'));
    });

    it('renders the charts loading fallback or the lazily loaded charts', function() {
      const html = render(dataFor());
      const showsFallback = html.includes(Translator.t('staff_statistics_page.charts_loading'));
      const showsCharts = html.includes('data-testid="statistics-visitors-new-returning-chart"')
        && html.includes('data-testid="statistics-visitors-audience-chart"');

      // The lazy charts chunk is cached once resolved, so either state is valid here.
      expect(showsFallback || showsCharts).toBeTrue();
    });
  });

  describe('.renderState', function() {
    const render = (state) => renderToStaticMarkup(StaffStatisticsVisitorsHelper.renderState(state));

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
