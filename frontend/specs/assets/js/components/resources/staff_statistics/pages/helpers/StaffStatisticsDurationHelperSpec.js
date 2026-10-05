import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsDurationHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsDurationHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import StatisticsDurationFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsDurationHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.duration.${key}`);
  const totalsFor = (overrides = {}) => ({
    visits: 1234, single_hit_visits: 617, singleHitShare: 0.5, average_duration_seconds: 274,
    median_duration_seconds: 90, average_hits: 3.4, median_hits: 2, ...overrides,
  });
  const zeroTotals = () => totalsFor({
    visits: 0, single_hit_visits: 0, singleHitShare: null, average_duration_seconds: null,
    median_duration_seconds: null, average_hits: null, median_hits: null,
  });
  const dataFor = (overrides = {}) => ({
    points: [{
      start: '2026-01-05', end: '2026-01-05', label: '5 Jan', visits: 1234, single_hit_visits: 617,
      singleHitShare: 0.5, average_duration_seconds: 274, median_duration_seconds: 90, average_hits: 3.4, median_hits: 2,
    }],
    bins: [{ lower: 0, upper: 1, labelKey: 'zero', count: 617, share: 0.5 }],
    totals: totalsFor(),
    granularity: 'day',
    empty: false,
    ...overrides,
  });
  const valueOf = (html, key) => {
    const marker = `data-testid="statistics-duration-${key}-value">`;
    const start = html.indexOf(marker) + marker.length;

    return html.slice(start, html.indexOf('<', start));
  };

  describe('.render', function() {
    const render = (data) => renderToStaticMarkup(StaffStatisticsDurationHelper.render(data));

    it('renders the section and the title', function() {
      const html = render(dataFor());

      expect(html).toContain('data-testid="statistics-duration"');
      expect(html).toContain(t('title'));
    });

    it('renders the totals tiles', function() {
      const html = render(dataFor());

      expect(valueOf(html, 'visits')).toBe(StatisticsBucketFormatter.count(1234));
      expect(valueOf(html, 'average_duration')).toBe(StatisticsDurationFormatter.format(274));
      expect(valueOf(html, 'median_duration')).toBe(StatisticsDurationFormatter.format(90));
      expect(valueOf(html, 'average_hits')).toBe(StatisticsBucketFormatter.decimal(3.4));
      expect(valueOf(html, 'single_hit_share')).toBe(StatisticsBucketFormatter.percent(0.5));
      expect(html).toContain(t('average_duration'));
    });

    it('does not render the empty note with visits', function() {
      expect(render(dataFor())).not.toContain('data-testid="statistics-duration-empty"');
    });

    it('renders the three chart titles', function() {
      const html = render(dataFor());

      expect(html).toContain(t('duration_chart'));
      expect(html).toContain(t('hits_chart'));
      expect(html).toContain(t('histogram_chart'));
    });

    it('renders the empty note, hides the share tile and still the charts without visits', function() {
      const html = render(dataFor({ empty: true, totals: zeroTotals() }));

      expect(html).toContain('data-testid="statistics-duration-empty"');
      expect(html).toContain(t('empty'));
      expect(html).not.toContain('data-testid="statistics-duration-single_hit_share"');
      expect(valueOf(html, 'visits')).toBe(StatisticsBucketFormatter.count(0));
      expect(html).toContain(t('duration_chart'));
      expect(html).toContain(t('hits_chart'));
      expect(html).toContain(t('histogram_chart'));
    });

    it('renders dashes for null averages', function() {
      const html = render(dataFor({ empty: true, totals: zeroTotals() }));

      expect(valueOf(html, 'average_duration')).toBe('—');
      expect(valueOf(html, 'median_duration')).toBe('—');
      expect(valueOf(html, 'average_hits')).toBe('—');
    });

    it('renders the charts loading fallback or the lazily loaded charts', function() {
      const html = render(dataFor());
      const showsFallback = html.includes(Translator.t('staff_statistics_page.charts_loading'));
      const showsCharts = html.includes('data-testid="statistics-duration-chart"')
        && html.includes('data-testid="statistics-hits-per-visit-chart"')
        && html.includes('data-testid="statistics-duration-histogram-chart"');

      // The lazy charts chunk is cached once resolved, so either state is valid here.
      expect(showsFallback || showsCharts).toBeTrue();
    });
  });

  describe('.renderState', function() {
    const render = (state) => renderToStaticMarkup(StaffStatisticsDurationHelper.renderState(state));

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
