import { renderToStaticMarkup } from 'react-dom/server';
import DurationChartTooltipHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DurationChartTooltipHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import StatisticsDurationFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('DurationChartTooltipHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.duration.${key}`);
  const pointFor = (overrides = {}) => ({
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan', visits: 2000, single_hit_visits: 500,
    singleHitShare: 0.25, average_duration_seconds: 274, median_duration_seconds: 90,
    average_hits: 2.5, median_hits: 2, ...overrides,
  });
  const emptyPoint = () => pointFor({
    visits: 0, single_hit_visits: 0, singleHitShare: null, average_duration_seconds: null,
    median_duration_seconds: null, average_hits: null, median_hits: null,
  });

  const render = (point, mode) => renderToStaticMarkup(DurationChartTooltipHelper.render(point, { mode }));

  it('renders the tooltip test id', function() {
    expect(render(pointFor(), 'duration')).toContain('data-testid="statistics-duration-tooltip"');
  });

  it('shows a single date for a single-day bucket', function() {
    const html = render(pointFor(), 'duration');

    expect(html).toContain(StatisticsBucketFormatter.range('2026-01-05', '2026-01-05'));
    expect(html).not.toContain(' – ');
  });

  it('shows the range for a multi-day bucket', function() {
    expect(render(pointFor({ end: '2026-01-11' }), 'hits'))
      .toContain(StatisticsBucketFormatter.range('2026-01-05', '2026-01-11'));
  });

  describe('in duration mode', function() {
    it('shows the durations, visits and single-hit share', function() {
      const html = render(pointFor(), 'duration');

      expect(html).toContain(`${t('average_duration')}: ${StatisticsDurationFormatter.format(274)}`);
      expect(html).toContain(`${t('median_duration')}: ${StatisticsDurationFormatter.format(90)}`);
      expect(html).toContain(`${t('visits')}: ${StatisticsBucketFormatter.count(2000)}`);
      expect(html).toContain(`${t('single_hit_share')}: ${StatisticsBucketFormatter.percent(0.25)}`);
      expect(html).not.toContain(t('average_hits'));
    });

    it('shows dashes and hides the share for an empty bucket', function() {
      const html = render(emptyPoint(), 'duration');

      expect(html).toContain(`${t('average_duration')}: —`);
      expect(html).toContain(`${t('median_duration')}: —`);
      expect(html).toContain(`${t('visits')}: 0`);
      expect(html).not.toContain(t('single_hit_share'));
    });
  });

  describe('in hits mode', function() {
    it('shows the hits, visits and single-hit share', function() {
      const html = render(pointFor(), 'hits');

      expect(html).toContain(`${t('average_hits')}: ${StatisticsBucketFormatter.decimal(2.5)}`);
      expect(html).toContain(`${t('median_hits')}: ${StatisticsBucketFormatter.decimal(2)}`);
      expect(html).toContain(`${t('single_hit_share')}: ${StatisticsBucketFormatter.percent(0.25)}`);
      expect(html).not.toContain(t('average_duration'));
    });

    it('shows dashes and hides the share for an empty bucket', function() {
      const html = render(emptyPoint(), 'hits');

      expect(html).toContain(`${t('average_hits')}: —`);
      expect(html).toContain(`${t('median_hits')}: —`);
      expect(html).not.toContain(t('single_hit_share'));
    });
  });
});
