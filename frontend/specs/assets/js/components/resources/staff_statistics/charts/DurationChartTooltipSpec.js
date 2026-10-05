import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DurationChartTooltip
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/DurationChartTooltip.jsx';

describe('DurationChartTooltip', function() {
  const point = {
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan', visits: 2, single_hit_visits: 1,
    singleHitShare: 0.5, average_duration_seconds: 30, median_duration_seconds: 20, average_hits: 2.5, median_hits: 2,
  };

  const render = (props) => renderToStaticMarkup(
    React.createElement(DurationChartTooltip, { mode: 'duration', ...props }),
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

  it('renders the hovered point in duration mode', function() {
    expect(render({ active: true, payload: [{ payload: point }] }))
      .toContain('data-testid="statistics-duration-tooltip"');
  });

  it('renders the hovered point in hits mode', function() {
    expect(render({ active: true, payload: [{ payload: point }], mode: 'hits' }))
      .toContain('data-testid="statistics-duration-tooltip"');
  });
});
