import React from 'react';
import {
  CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import TimeSeriesChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/TimeSeriesChartHelper.jsx';

describe('TimeSeriesChartHelper', function() {
  const points = [{ date: '2026-01-01', visitors: 3, users: 1 }];
  const visitors = { dataKey: 'visitors', color: 'var(--majora-chart-1)', label: 'Visitors' };
  const users = { dataKey: 'users', color: 'var(--majora-chart-2)', label: 'Users' };

  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const typesOf = (element) => childrenOf(element).map((child) => child.type);

  it('returns a LineChart with the points as data', function() {
    const element = TimeSeriesChartHelper.render(points, { xKey: 'date', series: [visitors] });

    expect(element.type).toBe(LineChart);
    expect(element.props.data).toBe(points);
  });

  it('composes grid, axes, tooltip and one line without a legend for one series', function() {
    const element = TimeSeriesChartHelper.render(points, { xKey: 'date', series: [visitors] });

    expect(typesOf(element)).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Line]);
  });

  it('adds a legend and one line per series for several series', function() {
    const element = TimeSeriesChartHelper.render(points, { xKey: 'date', series: [visitors, users] });

    expect(typesOf(element)).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Line]);
  });

  it('configures the grid, axes and lines', function() {
    const element = TimeSeriesChartHelper.render(points, { xKey: 'date', series: [visitors, users] });
    const [grid, xAxis, yAxis, , , firstLine, secondLine] = childrenOf(element);

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props.dataKey).toBe('date');
    expect(xAxis.props.stroke).toBe('var(--majora-chart-axis)');
    expect(yAxis.props.stroke).toBe('var(--majora-chart-axis)');
    expect(firstLine.props).toEqual(jasmine.objectContaining({
      type: 'monotone', dataKey: 'visitors', stroke: 'var(--majora-chart-1)',
      name: 'Visitors', isAnimationActive: false, dot: false,
    }));
    expect(secondLine.props.dataKey).toBe('users');
    expect(secondLine.props.name).toBe('Users');
  });
});
