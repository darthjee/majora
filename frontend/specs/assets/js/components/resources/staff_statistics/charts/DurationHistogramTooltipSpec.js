import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DurationHistogramTooltip
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/DurationHistogramTooltip.jsx';

describe('DurationHistogramTooltip', function() {
  const bin = { lower: 0, upper: 1, labelKey: 'zero', label: '0 s', count: 2, share: 0.5 };

  const render = (props) => renderToStaticMarkup(React.createElement(DurationHistogramTooltip, props));

  it('renders nothing while inactive', function() {
    expect(render({ active: false, payload: [{ payload: bin }] })).toBe('');
  });

  it('renders nothing without a payload', function() {
    expect(render({ active: true })).toBe('');
  });

  it('renders nothing with an empty payload', function() {
    expect(render({ active: true, payload: [] })).toBe('');
  });

  it('renders the hovered bin', function() {
    expect(render({ active: true, payload: [{ payload: bin }] }))
      .toContain('data-testid="statistics-duration-histogram-tooltip"');
  });
});
