import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DomainsChart
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/DomainsChart.jsx';
import DomainsChartHelper
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DomainsChartHelper.jsx';

describe('DomainsChart', function() {
  const row = (id, label, anonymous, loggedIn) => ({
    id, domain: label, group: 'Group', label, anonymous, logged_in: loggedIn,
    visits: anonymous + loggedIn, unique_visitors: anonymous, average_duration_seconds: null,
    median_duration_seconds: null, loggedInShare: null, unknown: id === 'unknown',
  });
  const testId = 'data-testid="statistics-domains-chart"';

  const render = (rows, series = ['anonymous', 'logged_in']) => renderToStaticMarkup(
    React.createElement(DomainsChart, { rows, series }),
  );

  it('renders the wrapper with empty data', function() {
    expect(render([])).toContain(testId);
  });

  it('renders the wrapper with a single row and one series', function() {
    expect(render([row(1, 'a.com', 3, 0)], ['anonymous'])).toContain(testId);
  });

  it('renders the wrapper with several rows and two series', function() {
    expect(render([row(1, 'a.com', 3, 1), row(2, 'b.com', 2, 2), row('unknown', 'Unknown', 1, 0)]))
      .toContain(testId);
  });

  describe('height', function() {
    const heightFor = (count) => {
      const rows = Array.from({ length: count }, (_, index) => row(index, `d${index}.com`, 1, 0));
      const element = DomainsChart({ rows, series: ['anonymous'] });

      return element.props.children.props.height;
    };

    it('is at least 300px', function() {
      expect(heightFor(0)).toBe(300);
      expect(heightFor(7)).toBe(300);
    });

    it('grows with the row count', function() {
      expect(heightFor(10)).toBe(380);
    });
  });

  it('passes the rows and series to the helper', function() {
    spyOn(DomainsChartHelper, 'render').and.callThrough();
    const rows = [row(1, 'a.com', 1, 1)];
    DomainsChart({ rows, series: ['logged_in'] });

    expect(DomainsChartHelper.render).toHaveBeenCalledWith(rows, { series: ['logged_in'] });
  });
});
