import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis,
} from 'recharts';
import DurationHistogramTooltip
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/DurationHistogramTooltip.jsx';
import DurationHistogramChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DurationHistogramChartHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('DurationHistogramChartHelper', function() {
  const bins = [
    { lower: 0, upper: 1, labelKey: 'zero', count: 1, share: 0.5 },
    { lower: 3600, upper: null, labelKey: 'over_1h', count: 1, share: 0.5 },
  ];
  const childrenOf = (element) => React.Children.toArray(element.props.children);

  it('returns a BarChart over the translated bins', function() {
    const element = DurationHistogramChartHelper.render(bins);

    expect(element.type).toBe(BarChart);
    expect(element.props.data.map((bin) => bin.label)).toEqual([
      Translator.t('staff_statistics_page.duration.bins.zero'),
      Translator.t('staff_statistics_page.duration.bins.over_1h'),
    ]);
    expect(element.props.data[0]).toEqual(jasmine.objectContaining(bins[0]));
  });

  it('composes grid, axes, tooltip and a single bar without a legend', function() {
    const types = childrenOf(DurationHistogramChartHelper.render(bins)).map((child) => child.type);

    expect(types).toEqual([CartesianGrid, XAxis, YAxis, Tooltip, Bar]);
  });

  it('configures the axes, tooltip and bar', function() {
    const [grid, xAxis, yAxis, tooltip, bar] = childrenOf(DurationHistogramChartHelper.render(bins));

    expect(grid.props.stroke).toBe('var(--majora-chart-grid)');
    expect(xAxis.props).toEqual(jasmine.objectContaining({ dataKey: 'label', stroke: 'var(--majora-chart-axis)' }));
    expect(yAxis.props).toEqual(jasmine.objectContaining({ allowDecimals: false, stroke: 'var(--majora-chart-axis)' }));
    expect(tooltip.props.content.type).toBe(DurationHistogramTooltip);
    expect(bar.props).toEqual(jasmine.objectContaining({
      dataKey: 'count', fill: 'var(--majora-chart-3)',
      name: Translator.t('staff_statistics_page.duration.visits'), isAnimationActive: false,
    }));
  });

  it('does not mutate the given bins', function() {
    DurationHistogramChartHelper.render(bins);

    expect(bins[0].label).toBeUndefined();
  });
});
