import { renderToStaticMarkup } from 'react-dom/server';
import VisitorsChartTooltipHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/VisitorsChartTooltipHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('VisitorsChartTooltipHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.visitors.${key}`);
  const count = (value) => StatisticsBucketFormatter.count(value);
  const percent = (value) => StatisticsBucketFormatter.percent(value);
  const pointFor = (overrides = {}) => ({
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    unique_visitors: 2000, new_visitors: 1500, returning_visitors: 500,
    anonymous: 1200, logged_in: 800, returningShare: 0.25, loggedInShare: 0.4, ...overrides,
  });
  const zeroPoint = () => pointFor({
    unique_visitors: 0, new_visitors: 0, returning_visitors: 0, anonymous: 0, logged_in: 0,
    returningShare: null, loggedInShare: null,
  });

  const render = (point, options) => renderToStaticMarkup(VisitorsChartTooltipHelper.render(point, options));

  it('renders the tooltip test id', function() {
    expect(render(pointFor(), { mode: 'newReturning' })).toContain('data-testid="statistics-visitors-tooltip"');
  });

  it('shows a single date for a single-day bucket', function() {
    expect(render(pointFor(), { mode: 'newReturning' }))
      .toContain(StatisticsBucketFormatter.range('2026-01-05', '2026-01-05'));
  });

  it('shows the range for a multi-day bucket', function() {
    expect(render(pointFor({ end: '2026-01-11' }), { mode: 'audience' }))
      .toContain(StatisticsBucketFormatter.range('2026-01-05', '2026-01-11'));
  });

  describe('in newReturning mode', function() {
    const options = { mode: 'newReturning' };

    it('shows the new and returning lines, the total and the returning share', function() {
      const html = render(pointFor(), options);

      expect(html).toContain(`${t('new')}: ${count(1500)}`);
      expect(html).toContain(`${t('returning')}: ${count(500)}`);
      expect(html).toContain(`${t('total')}: ${count(2000)}`);
      expect(html).toContain(`${t('returning_share')}: ${percent(0.25)}`);
      expect(html).not.toContain(t('logged_in_share'));
    });

    it('hides the share for a bucket without visitors', function() {
      const html = render(zeroPoint(), options);

      expect(html).not.toContain(t('returning_share'));
      expect(html).toContain(`${t('total')}: 0`);
    });
  });

  describe('in audience mode', function() {
    it('shows both lines, the total and the logged-in share', function() {
      const html = render(pointFor(), { mode: 'audience', series: ['anonymous', 'logged_in'] });

      expect(html).toContain(`${t('anonymous')}: ${count(1200)}`);
      expect(html).toContain(`${t('logged_in')}: ${count(800)}`);
      expect(html).toContain(`${t('total')}: ${count(2000)}`);
      expect(html).toContain(`${t('logged_in_share')}: ${percent(0.4)}`);
      expect(html).not.toContain(t('returning_share'));
    });

    it('defaults to both series without series', function() {
      const html = render(pointFor(), { mode: 'audience' });

      expect(html).toContain(`${t('logged_in_share')}: ${percent(0.4)}`);
    });

    it('hides the share for a bucket without visitors', function() {
      const html = render(zeroPoint(), { mode: 'audience', series: ['anonymous', 'logged_in'] });

      expect(html).not.toContain(t('logged_in_share'));
    });

    it('omits the hidden series and the share with a filtered audience', function() {
      const html = render(pointFor(), { mode: 'audience', series: ['logged_in'] });

      expect(html).not.toContain(`${t('anonymous')}:`);
      expect(html).toContain(`${t('logged_in')}: ${count(800)}`);
      expect(html).not.toContain(t('logged_in_share'));
    });
  });
});
