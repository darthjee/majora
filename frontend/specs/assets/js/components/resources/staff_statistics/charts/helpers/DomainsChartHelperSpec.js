import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import DomainsChartTooltip
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/DomainsChartTooltip.jsx';
import DomainsChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DomainsChartHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('DomainsChartHelper', function() {
  const rows = [{
    id: 3, domain: 'example.com', group: 'Search', label: 'example.com', anonymous: 7, logged_in: 3,
    visits: 10, unique_visitors: 8, average_duration_seconds: 120, median_duration_seconds: 90,
    loggedInShare: 0.3, unknown: false,
  }];

  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const typesOf = (element) => childrenOf(element).map((child) => child.type);
  const barsOf = (element) => childrenOf(element).filter((child) => child.type === Bar);

  it('returns a vertical BarChart with the rows as data', function() {
    const element = DomainsChartHelper.render(rows, { series: ['anonymous'] });

    expect(element.type).toBe(BarChart);
    expect(element.props.data).toBe(rows);
    expect(element.props.layout).toBe('vertical');
  });

  it('composes grid, axes, tooltip, legend and one bar per series', function() {
    const element = DomainsChartHelper.render(rows, { series: ['anonymous', 'logged_in'] });

    expect(typesOf(element)).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Bar]);
  });

  it('configures the grid, axes and tooltip', function() {
    const series = ['anonymous', 'logged_in'];
    const [grid, xAxis, yAxis, tooltip] = childrenOf(DomainsChartHelper.render(rows, { series }));

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props).toEqual(jasmine.objectContaining({
      type: 'number', allowDecimals: false, stroke: 'var(--majora-chart-axis)',
    }));
    expect(yAxis.props).toEqual(jasmine.objectContaining({
      type: 'category', dataKey: 'label', stroke: 'var(--majora-chart-axis)',
    }));
    expect(yAxis.props.width).toBeGreaterThanOrEqual(120);
    expect(tooltip.props.content.type).toBe(DomainsChartTooltip);
    expect(tooltip.props.content.props).toEqual(jasmine.objectContaining({ series }));
  });

  it('stacks anonymous then logged-in on the same stack', function() {
    const [first, second] = barsOf(DomainsChartHelper.render(rows, { series: ['logged_in', 'anonymous'] }));

    expect(first.props).toEqual(jasmine.objectContaining({
      dataKey: 'anonymous', stackId: 'visits', fill: 'var(--majora-chart-1)',
      name: Translator.t('staff_statistics_page.domains.anonymous'), isAnimationActive: false,
    }));
    expect(second.props).toEqual(jasmine.objectContaining({
      dataKey: 'logged_in', stackId: 'visits', fill: 'var(--majora-chart-2)',
      name: Translator.t('staff_statistics_page.domains.logged_in'), isAnimationActive: false,
    }));
  });

  it('renders only the anonymous bar for the anonymous audience', function() {
    const bars = barsOf(DomainsChartHelper.render(rows, { series: ['anonymous'] }));

    expect(bars.map((bar) => bar.props.dataKey)).toEqual(['anonymous']);
  });

  it('renders only the logged-in bar for the logged_in audience', function() {
    const bars = barsOf(DomainsChartHelper.render(rows, { series: ['logged_in'] }));

    expect(bars.map((bar) => bar.props.dataKey)).toEqual(['logged_in']);
  });

  it('renders an empty chart without rows', function() {
    const element = DomainsChartHelper.render([], { series: ['anonymous', 'logged_in'] });

    expect(element.props.data).toEqual([]);
  });
});
