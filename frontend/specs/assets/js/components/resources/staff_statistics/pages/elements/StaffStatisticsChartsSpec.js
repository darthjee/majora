import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsCharts
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsCharts.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('StaffStatisticsCharts', function() {
  const loadingText = Translator.t('staff_statistics_page.charts_loading');
  const chartTestId = 'data-testid="statistics-visitors-chart"';

  const render = () => renderToStaticMarkup(React.createElement(StaffStatisticsCharts, {
    chart: 'TimeSeriesChart',
    name: 'visitors',
    points: [],
    xKey: 'date',
    series: [{ dataKey: 'visitors', color: 'var(--majora-chart-1)', label: 'Visitors' }],
  }));

  it('does not throw for a valid chart name', function() {
    expect(render).not.toThrow();
  });

  it('renders the loading fallback until the charts chunk resolves', function() {
    const html = render();
    const showsFallback = html.includes(loadingText);
    const showsChart = html.includes(chartTestId);

    // The lazy chunk is cached once resolved, so an earlier spec may already have loaded it.
    expect(showsFallback || showsChart).toBeTrue();
    expect(showsFallback && showsChart).toBeFalse();
  });

  it('renders the named chart once the charts chunk is loaded', async function() {
    render();
    await import('../../../../../../../../assets/js/components/resources/staff_statistics/charts/index.js');
    await flushMicrotasks(20);

    const html = render();

    expect(html).toContain(chartTestId);
    expect(html).not.toContain(loadingText);
  });
});
