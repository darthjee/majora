import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitorsAudienceChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitorsAudienceChart.jsx';

describe('VisitorsAudienceChart', function() {
  const point = (label, anonymous, loggedIn) => ({
    start: '2026-01-05', end: '2026-01-05', label,
    unique_visitors: anonymous + loggedIn, new_visitors: anonymous, returning_visitors: loggedIn,
    anonymous, logged_in: loggedIn, returningShare: 0.5, loggedInShare: 0.5,
  });
  const testId = 'data-testid="statistics-visitors-audience-chart"';

  const render = (points, series = ['anonymous', 'logged_in']) => renderToStaticMarkup(
    React.createElement(VisitorsAudienceChart, { points, series }),
  );

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain(testId);
  });

  it('renders the wrapper with a single point and one series', function() {
    expect(render([point('5 Jan', 3, 0)], ['anonymous'])).toContain(testId);
  });

  it('renders the wrapper with several points and two series', function() {
    expect(render([point('5 Jan', 3, 1), point('6 Jan', 2, 2), point('7 Jan', 0, 4)])).toContain(testId);
  });
});
