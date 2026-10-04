import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import VisitsChartTooltip
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/VisitsChartTooltip.jsx';
import VisitsChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/VisitsChartHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('VisitsChartHelper', function() {
  const points = [{
    start: '2026-01-05', end: '2026-01-05', label: '5 Jan',
    anonymous: 3, logged_in: 1, visits: 4, loggedInShare: 0.25,
  }];

  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const typesOf = (element) => childrenOf(element).map((child) => child.type);
  const barsOf = (element) => childrenOf(element).filter((child) => child.type === Bar);

  it('returns a BarChart with the points as data', function() {
    const element = VisitsChartHelper.render(points, { series: ['anonymous'] });

    expect(element.type).toBe(BarChart);
    expect(element.props.data).toBe(points);
  });

  it('composes grid, axes, tooltip, legend and one bar per series', function() {
    const element = VisitsChartHelper.render(points, { series: ['anonymous', 'logged_in'] });

    expect(typesOf(element)).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Bar]);
  });

  it('configures the grid, axes and tooltip', function() {
    const series = ['anonymous', 'logged_in'];
    const [grid, xAxis, yAxis, tooltip] = childrenOf(VisitsChartHelper.render(points, { series }));

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props).toEqual(jasmine.objectContaining({ dataKey: 'label', stroke: 'var(--majora-chart-axis)' }));
    expect(yAxis.props).toEqual(jasmine.objectContaining({ allowDecimals: false, stroke: 'var(--majora-chart-axis)' }));
    expect(tooltip.props.content.type).toBe(VisitsChartTooltip);
    expect(tooltip.props.content.props.series).toBe(series);
  });

  it('stacks anonymous below logged-in', function() {
    const [first, second] = barsOf(VisitsChartHelper.render(points, { series: ['logged_in', 'anonymous'] }));

    expect(first.props).toEqual(jasmine.objectContaining({
      dataKey: 'anonymous', stackId: 'visits', fill: 'var(--majora-chart-1)',
      name: Translator.t('staff_statistics_page.visits.anonymous'), isAnimationActive: false,
    }));
    expect(second.props).toEqual(jasmine.objectContaining({
      dataKey: 'logged_in', stackId: 'visits', fill: 'var(--majora-chart-2)',
      name: Translator.t('staff_statistics_page.visits.logged_in'), isAnimationActive: false,
    }));
  });

  it('renders only the anonymous bar for the anonymous audience', function() {
    const bars = barsOf(VisitsChartHelper.render(points, { series: ['anonymous'] }));

    expect(bars.map((bar) => bar.props.dataKey)).toEqual(['anonymous']);
  });

  it('renders only the logged-in bar for the logged_in audience', function() {
    const bars = barsOf(VisitsChartHelper.render(points, { series: ['logged_in'] }));

    expect(bars.map((bar) => bar.props.dataKey)).toEqual(['logged_in']);
  });
});
