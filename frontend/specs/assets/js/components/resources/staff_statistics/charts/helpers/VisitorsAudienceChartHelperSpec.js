import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import VisitorsChartTooltip
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitorsChartTooltip.jsx';
import VisitorsAudienceChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/VisitorsAudienceChartHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('VisitorsAudienceChartHelper', function() {
  const points = [{
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    unique_visitors: 4, new_visitors: 3, returning_visitors: 1, anonymous: 3, logged_in: 1,
    returningShare: 0.25, loggedInShare: 0.25,
  }];

  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const typesOf = (element) => childrenOf(element).map((child) => child.type);
  const barsOf = (element) => childrenOf(element).filter((child) => child.type === Bar);

  it('returns a BarChart with the points as data', function() {
    const element = VisitorsAudienceChartHelper.render(points, { series: ['anonymous'] });

    expect(element.type).toBe(BarChart);
    expect(element.props.data).toBe(points);
  });

  it('composes grid, axes, tooltip, legend and one bar per series', function() {
    const element = VisitorsAudienceChartHelper.render(points, { series: ['anonymous', 'logged_in'] });

    expect(typesOf(element)).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Bar]);
  });

  it('configures the grid, axes and tooltip', function() {
    const series = ['anonymous', 'logged_in'];
    const [grid, xAxis, yAxis, tooltip] = childrenOf(VisitorsAudienceChartHelper.render(points, { series }));

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props).toEqual(jasmine.objectContaining({ dataKey: 'label', stroke: 'var(--majora-chart-axis)' }));
    expect(yAxis.props).toEqual(jasmine.objectContaining({ allowDecimals: false, stroke: 'var(--majora-chart-axis)' }));
    expect(tooltip.props.content.type).toBe(VisitorsChartTooltip);
    expect(tooltip.props.content.props).toEqual(jasmine.objectContaining({ mode: 'audience', series }));
  });

  it('stacks anonymous below logged-in', function() {
    const [first, second] = barsOf(VisitorsAudienceChartHelper.render(points, { series: ['logged_in', 'anonymous'] }));

    expect(first.props).toEqual(jasmine.objectContaining({
      dataKey: 'anonymous', stackId: 'audience', fill: 'var(--majora-chart-1)',
      name: Translator.t('staff_statistics_page.visitors.anonymous'), isAnimationActive: false,
    }));
    expect(second.props).toEqual(jasmine.objectContaining({
      dataKey: 'logged_in', stackId: 'audience', fill: 'var(--majora-chart-2)',
      name: Translator.t('staff_statistics_page.visitors.logged_in'), isAnimationActive: false,
    }));
  });

  it('renders only the anonymous bar for the anonymous audience', function() {
    const bars = barsOf(VisitorsAudienceChartHelper.render(points, { series: ['anonymous'] }));

    expect(bars.map((bar) => bar.props.dataKey)).toEqual(['anonymous']);
  });

  it('renders only the logged-in bar for the logged_in audience', function() {
    const bars = barsOf(VisitorsAudienceChartHelper.render(points, { series: ['logged_in'] }));

    expect(bars.map((bar) => bar.props.dataKey)).toEqual(['logged_in']);
  });
});
