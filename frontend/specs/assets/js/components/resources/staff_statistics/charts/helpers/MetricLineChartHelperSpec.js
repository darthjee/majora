import React from 'react';
import {
  CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import DurationChartTooltip
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/DurationChartTooltip.jsx';
import { HITS_SERIES }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/chartSeries.js';
import MetricLineChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/MetricLineChartHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('MetricLineChartHelper', function() {
  const points = [{ label: '5 Jan', average_hits: 2.5, median_hits: 2 }];
  const tickFormatter = (value) => String(value);
  const options = { definitions: HITS_SERIES, tickFormatter, mode: 'hits' };

  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const linesOf = (element) => childrenOf(element).filter((child) => child.type === Line);

  it('returns a LineChart with the points as data', function() {
    const element = MetricLineChartHelper.render(points, options);

    expect(element.type).toBe(LineChart);
    expect(element.props.data).toBe(points);
  });

  it('composes grid, axes, tooltip, legend and one line per series', function() {
    const types = childrenOf(MetricLineChartHelper.render(points, options)).map((child) => child.type);

    expect(types).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Line]);
  });

  it('configures the grid, axes and tooltip', function() {
    const [grid, xAxis, yAxis, tooltip] = childrenOf(MetricLineChartHelper.render(points, options));

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props).toEqual(jasmine.objectContaining({ dataKey: 'label', stroke: 'var(--majora-chart-axis)' }));
    expect(yAxis.props).toEqual(jasmine.objectContaining({ tickFormatter, stroke: 'var(--majora-chart-axis)' }));
    expect(tooltip.props.content.type).toBe(DurationChartTooltip);
    expect(tooltip.props.content.props.mode).toBe('hits');
  });

  it('renders gapped lines with a small dot', function() {
    const [average, median] = linesOf(MetricLineChartHelper.render(points, options));

    expect(average.props).toEqual(jasmine.objectContaining({
      type: 'monotone', dataKey: 'average_hits', stroke: 'var(--majora-chart-1)',
      name: Translator.t('staff_statistics_page.duration.average_hits'),
      connectNulls: false, dot: { r: 2 }, isAnimationActive: false,
    }));
    expect(median.props).toEqual(jasmine.objectContaining({
      dataKey: 'median_hits', stroke: 'var(--majora-chart-2)',
      name: Translator.t('staff_statistics_page.duration.median_hits'), connectNulls: false,
    }));
  });
});
