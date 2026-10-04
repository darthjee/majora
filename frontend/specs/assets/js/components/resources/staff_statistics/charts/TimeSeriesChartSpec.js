import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TimeSeriesChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/TimeSeriesChart.jsx';

describe('TimeSeriesChart', function() {
  const series = [
    { dataKey: 'visitors', color: 'var(--majora-chart-1)', label: 'Visitors' },
    { dataKey: 'users', color: 'var(--majora-chart-2)', label: 'Users' },
  ];

  const render = (points, chartSeries = series) => renderToStaticMarkup(
    React.createElement(TimeSeriesChart, { name: 'visitors', points, xKey: 'date', series: chartSeries }),
  );

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain('data-testid="statistics-visitors-chart"');
  });

  it('renders the wrapper with a single point', function() {
    expect(render([{ date: '2026-01-01', visitors: 3 }], [series[0]]))
      .toContain('data-testid="statistics-visitors-chart"');
  });

  it('renders the wrapper with several points and two series', function() {
    const points = [
      { date: '2026-01-01', visitors: 3, users: 1 },
      { date: '2026-01-02', visitors: 5, users: 2 },
      { date: '2026-01-03', visitors: 4, users: 2 },
    ];

    expect(render(points)).toContain('data-testid="statistics-visitors-chart"');
  });
});
