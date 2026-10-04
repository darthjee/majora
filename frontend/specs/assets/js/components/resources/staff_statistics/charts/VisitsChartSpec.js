import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitsChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitsChart.jsx';

describe('VisitsChart', function() {
  const point = (label, anonymous, loggedIn) => ({
    start: '2026-01-05', end: '2026-01-05', label, anonymous, logged_in: loggedIn,
    visits: anonymous + loggedIn, loggedInShare: loggedIn / (anonymous + loggedIn),
  });
  const testId = 'data-testid="statistics-visits-chart"';

  const render = (points, series = ['anonymous', 'logged_in']) => renderToStaticMarkup(
    React.createElement(VisitsChart, { points, series }),
  );

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain(testId);
  });

  it('renders the wrapper with a single point and one series', function() {
    expect(render([point('5 Jan', 3, 0)], ['anonymous'])).toContain(testId);
  });

  it('renders the wrapper with several points and two series', function() {
    const points = [point('5 Jan', 3, 1), point('6 Jan', 2, 2), point('7 Jan', 0, 4)];

    expect(render(points)).toContain(testId);
  });
});
