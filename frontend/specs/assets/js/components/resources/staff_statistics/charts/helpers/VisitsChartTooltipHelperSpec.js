import { renderToStaticMarkup } from 'react-dom/server';
import VisitsChartTooltipHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/VisitsChartTooltipHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('VisitsChartTooltipHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.visits.${key}`);
  const both = ['anonymous', 'logged_in'];
  const pointFor = (overrides = {}) => ({
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    anonymous: 1500, logged_in: 500, visits: 2000, loggedInShare: 0.25, ...overrides,
  });

  const render = (point, series = both) => renderToStaticMarkup(VisitsChartTooltipHelper.render(point, series));

  it('shows a single date for a single-day bucket', function() {
    expect(render(pointFor())).toContain(StatisticsBucketFormatter.range('2026-01-05', '2026-01-05'));
  });

  it('shows the range for a multi-day bucket', function() {
    expect(render(pointFor({ end: '2026-01-11' })))
      .toContain(StatisticsBucketFormatter.range('2026-01-05', '2026-01-11'));
  });

  it('shows one line per series and the total', function() {
    const html = render(pointFor());

    expect(html).toContain(`${t('anonymous')}: ${StatisticsBucketFormatter.count(1500)}`);
    expect(html).toContain(`${t('logged_in')}: ${StatisticsBucketFormatter.count(500)}`);
    expect(html).toContain(`${t('total')}: ${StatisticsBucketFormatter.count(2000)}`);
  });

  it('shows the logged-in share when both series are visible', function() {
    expect(render(pointFor()))
      .toContain(`${t('logged_in_share')}: ${StatisticsBucketFormatter.percent(0.25)}`);
  });

  it('hides the share for a bucket without visits', function() {
    const html = render(pointFor({ anonymous: 0, logged_in: 0, visits: 0, loggedInShare: null }));

    expect(html).not.toContain(t('logged_in_share'));
    expect(html).toContain(`${t('total')}: 0`);
  });

  it('omits the hidden series and the share for a single series', function() {
    const html = render(pointFor({ anonymous: 0, visits: 500, loggedInShare: 1 }), ['logged_in']);

    expect(html).not.toContain(`${t('anonymous')}:`);
    expect(html).toContain(`${t('logged_in')}: ${StatisticsBucketFormatter.count(500)}`);
    expect(html).not.toContain(t('logged_in_share'));
  });
});
