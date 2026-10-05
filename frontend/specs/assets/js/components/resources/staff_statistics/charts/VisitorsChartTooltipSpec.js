import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitorsChartTooltip
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitorsChartTooltip.jsx';

describe('VisitorsChartTooltip', function() {
  const point = {
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    unique_visitors: 4, new_visitors: 3, returning_visitors: 1, anonymous: 3, logged_in: 1,
    returningShare: 0.25, loggedInShare: 0.25,
  };

  const render = (props) => renderToStaticMarkup(
    React.createElement(VisitorsChartTooltip, { mode: 'newReturning', ...props }),
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
      .toContain('data-testid="statistics-visitors-tooltip"');
  });

  it('passes the audience mode and series', function() {
    const html = render({
      active: true, payload: [{ payload: point }], mode: 'audience', series: ['logged_in'],
    });

    expect(html).toContain('data-testid="statistics-visitors-tooltip"');
  });
});
