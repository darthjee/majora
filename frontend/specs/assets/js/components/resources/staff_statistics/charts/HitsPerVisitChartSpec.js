import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HitsPerVisitChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/HitsPerVisitChart.jsx';

describe('HitsPerVisitChart', function() {
  const point = (label, average, median) => ({
    start: '2026-01-05', end: '2026-01-05', label, visits: 2, single_hit_visits: 1, singleHitShare: 0.5,
    average_duration_seconds: average, median_duration_seconds: median, average_hits: average, median_hits: median,
  });
  const testId = 'data-testid="statistics-hits-per-visit-chart"';

  const render = (points) => renderToStaticMarkup(React.createElement(HitsPerVisitChart, { points }));

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain(testId);
  });

  it('renders the wrapper with a single point', function() {
    expect(render([point('5 Jan', 30, 20)])).toContain(testId);
  });

  it('renders the wrapper with several points and gaps', function() {
    expect(render([point('5 Jan', 30, 20), point('6 Jan', null, null), point('7 Jan', 3, 2)])).toContain(testId);
  });
});
