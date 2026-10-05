import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitorsNewReturningChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitorsNewReturningChart.jsx';

describe('VisitorsNewReturningChart', function() {
  const point = (label, newVisitors, returning) => ({
    start: '2026-01-05', end: '2026-01-05', label,
    unique_visitors: newVisitors + returning, new_visitors: newVisitors, returning_visitors: returning,
    anonymous: newVisitors, logged_in: returning, returningShare: 0.5, loggedInShare: 0.5,
  });
  const testId = 'data-testid="statistics-visitors-new-returning-chart"';

  const render = (points) => renderToStaticMarkup(
    React.createElement(VisitorsNewReturningChart, { points }),
  );

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain(testId);
  });

  it('renders the wrapper with a single point', function() {
    expect(render([point('5 Jan', 3, 0)])).toContain(testId);
  });

  it('renders the wrapper with several points', function() {
    expect(render([point('5 Jan', 3, 1), point('6 Jan', 2, 2), point('7 Jan', 0, 4)])).toContain(testId);
  });
});
