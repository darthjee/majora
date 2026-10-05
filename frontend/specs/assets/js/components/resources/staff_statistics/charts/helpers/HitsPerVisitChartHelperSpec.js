import React from 'react';
import { Line, LineChart, Tooltip, YAxis } from 'recharts';
import HitsPerVisitChartHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/HitsPerVisitChartHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('HitsPerVisitChartHelper', function() {
  const points = [{ label: '5 Jan', average_hits: 2.5, median_hits: null }];
  const childrenOf = (element) => React.Children.toArray(element.props.children);
  const childOf = (element, type) => childrenOf(element).find((child) => child.type === type);

  it('returns a LineChart with the points as data', function() {
    const element = HitsPerVisitChartHelper.render(points);

    expect(element.type).toBe(LineChart);
    expect(element.props.data).toBe(points);
  });

  it('renders the average and median hits lines', function() {
    const lines = childrenOf(HitsPerVisitChartHelper.render(points)).filter((child) => child.type === Line);

    expect(lines.map((line) => line.props.dataKey)).toEqual(['average_hits', 'median_hits']);
    expect(lines.map((line) => line.props.stroke)).toEqual(['var(--majora-chart-1)', 'var(--majora-chart-2)']);
    expect(lines.map((line) => line.props.name)).toEqual([
      Translator.t('staff_statistics_page.duration.average_hits'),
      Translator.t('staff_statistics_page.duration.median_hits'),
    ]);
    expect(lines.every((line) => line.props.connectNulls === false)).toBeTrue();
  });

  it('formats the Y axis with at most one decimal, ignoring the tick index', function() {
    const yAxis = childOf(HitsPerVisitChartHelper.render(points), YAxis);

    expect(yAxis.props.tickFormatter(2.25, 3)).toBe(StatisticsBucketFormatter.decimal(2.25));
  });

  it('uses the hits tooltip mode', function() {
    expect(childOf(HitsPerVisitChartHelper.render(points), Tooltip).props.content.props.mode).toBe('hits');
  });
});
