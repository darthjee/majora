import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitsChartTooltip
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitsChartTooltip.jsx';

describe('VisitsChartTooltip', function() {
  const point = {
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    anonymous: 3, logged_in: 1, visits: 4, loggedInShare: 0.25,
  };
  const series = ['anonymous', 'logged_in'];

  const render = (props) => renderToStaticMarkup(
    React.createElement(VisitsChartTooltip, { series, ...props }),
  );

  it('renders nothing while inactive', function() {
    expect(render({ active: false, payload: [{ payload: point }] })).toBe('');
  });

  it('renders nothing without a payload', function() {
    expect(render({ active: true })).toBe('');
  });

  it('renders nothing with an empty payload', function() {
    expect(render({ active: true, payload: [] })).toBe('');
  });

  it('renders the hovered point', function() {
    expect(render({ active: true, payload: [{ payload: point }] }))
      .toContain('data-testid="statistics-visits-tooltip"');
  });
});
