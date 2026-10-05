import React from 'react';
import { Line, LineChart, Tooltip, YAxis } from 'recharts';
import DurationChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DurationChartHelper.jsx';
import StatisticsDurationFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('DurationChartHelper', function() {
  const points = [{ label: '5 Jan', average_duration_seconds: 90, median_duration_seconds: null }];
  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const childOf = (element, type) => childrenOf(element).find((child) => child.type === type);

  it('returns a LineChart with the points as data', function() {
    const element = DurationChartHelper.render(points);

    expect(element.type).toBe(LineChart);
    expect(element.props.data).toBe(points);
  });

  it('renders the average and median duration lines', function() {
    const lines = childrenOf(DurationChartHelper.render(points)).filter((child) => child.type === Line);

    expect(lines.map((line) => line.props.dataKey)).toEqual(['average_duration_seconds', 'median_duration_seconds']);
    expect(lines.map((line) => line.props.stroke)).toEqual(['var(--majora-chart-1)', 'var(--majora-chart-2)']);
    expect(lines.map((line) => line.props.name)).toEqual([
      Translator.t('staff_statistics_page.duration.average_duration'),
      Translator.t('staff_statistics_page.duration.median_duration'),
    ]);
    expect(lines.every((line) => line.props.connectNulls === false)).toBeTrue();
  });

  it('formats the Y axis as durations', function() {
    const yAxis = childOf(DurationChartHelper.render(points), YAxis);

    expect(yAxis.props.tickFormatter(274, 0)).toBe(StatisticsDurationFormatter.format(274));
  });

  it('uses the duration tooltip mode', function() {
    expect(childOf(DurationChartHelper.render(points), Tooltip).props.content.props.mode).toBe('duration');
  });
});
