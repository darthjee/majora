import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import VisitorsChartTooltip
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitorsChartTooltip.jsx';
import VisitorsNewReturningChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/VisitorsNewReturningChartHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('VisitorsNewReturningChartHelper', function() {
  const points = [{
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    unique_visitors: 4, new_visitors: 3, returning_visitors: 1, anonymous: 3, logged_in: 1,
    returningShare: 0.25, loggedInShare: 0.25,
  }];

  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const typesOf = (element) => childrenOf(element).map((child) => child.type);
  const barsOf = (element) => childrenOf(element).filter((child) => child.type === Bar);

  it('returns a BarChart with the points as data', function() {
    const element = VisitorsNewReturningChartHelper.render(points);

    expect(element.type).toBe(BarChart);
    expect(element.props.data).toBe(points);
  });

  it('composes grid, axes, tooltip, legend and both bars', function() {
    expect(typesOf(VisitorsNewReturningChartHelper.render(points)))
      .toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Bar]);
  });

  it('configures the grid, axes and tooltip', function() {
    const [grid, xAxis, yAxis, tooltip] = childrenOf(VisitorsNewReturningChartHelper.render(points));

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props).toEqual(jasmine.objectContaining({ dataKey: 'label', stroke: 'var(--majora-chart-axis)' }));
    expect(yAxis.props).toEqual(jasmine.objectContaining({ allowDecimals: false, stroke: 'var(--majora-chart-axis)' }));
    expect(tooltip.props.content.type).toBe(VisitorsChartTooltip);
    expect(tooltip.props.content.props.mode).toBe('newReturning');
  });

  it('stacks new below returning visitors', function() {
    const [first, second] = barsOf(VisitorsNewReturningChartHelper.render(points));

    expect(first.props).toEqual(jasmine.objectContaining({
      dataKey: 'new_visitors', stackId: 'new-returning', fill: 'var(--majora-chart-3)',
      name: Translator.t('staff_statistics_page.visitors.new'), isAnimationActive: false,
    }));
    expect(second.props).toEqual(jasmine.objectContaining({
      dataKey: 'returning_visitors', stackId: 'new-returning', fill: 'var(--majora-chart-4)',
      name: Translator.t('staff_statistics_page.visitors.returning'), isAnimationActive: false,
    }));
  });
});
