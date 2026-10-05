import { renderToStaticMarkup } from 'react-dom/server';
import DurationHistogramTooltipHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DurationHistogramTooltipHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('DurationHistogramTooltipHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.duration.${key}`);
  const binFor = (overrides = {}) => ({
    lower: 60, upper: 180, labelKey: '1m_3m', label: 'One to three', count: 1500, share: 0.75, ...overrides,
  });

  const render = (bin) => renderToStaticMarkup(DurationHistogramTooltipHelper.render(bin));

  it('renders the tooltip test id', function() {
    expect(render(binFor())).toContain('data-testid="statistics-duration-histogram-tooltip"');
  });

  it('shows the label, visits and share', function() {
    const html = render(binFor());

    expect(html).toContain('One to three');
    expect(html).toContain(`${t('visits')}: ${StatisticsBucketFormatter.count(1500)}`);
    expect(html).toContain(`${t('histogram_share')}: ${StatisticsBucketFormatter.percent(0.75)}`);
  });

  it('hides the share when there are no visits', function() {
    const html = render(binFor({ count: 0, share: null }));

    expect(html).toContain(`${t('visits')}: 0`);
    expect(html).not.toContain(t('histogram_share'));
  });
});
