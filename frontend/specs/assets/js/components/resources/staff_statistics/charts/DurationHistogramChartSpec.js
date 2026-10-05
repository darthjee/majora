import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DurationHistogramChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/DurationHistogramChart.jsx';

describe('DurationHistogramChart', function() {
  const bin = (lower, labelKey, count, share) => ({ lower, upper: null, labelKey, count, share });
  const testId = 'data-testid="statistics-duration-histogram-chart"';

  const render = (bins) => renderToStaticMarkup(React.createElement(DurationHistogramChart, { bins }));

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain(testId);
  });

  it('renders the wrapper with a single bin', function() {
    expect(render([bin(0, 'zero', 0, null)])).toContain(testId);
  });

  it('renders the wrapper with several bins', function() {
    expect(render([bin(0, 'zero', 1, 0.5), bin(1, 'under_30s', 1, 0.5)])).toContain(testId);
  });
});
