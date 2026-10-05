import StatisticsBucketFormatter from '../../pages/helpers/StatisticsBucketFormatter.js';
import { HITS_SERIES } from './chartSeries.js';
import MetricLineChartHelper from './MetricLineChartHelper.jsx';

/**
 * Rendering helper for the `HitsPerVisitChart` component (issue #1514).
 */
export default class HitsPerVisitChartHelper {
  /**
   * Renders the average vs median hits per visit line chart.
   *
   * @description Delegates to `MetricLineChartHelper` with the hits series, a Y axis with at
   *   most one decimal and the `hits` tooltip mode.
   * @param {object[]} points - Chart points (see `DurationController.map`).
   * @returns {React.ReactElement} The `LineChart` element.
   */
  static render(points) {
    return MetricLineChartHelper.render(points, {
      definitions: HITS_SERIES,
      tickFormatter: HitsPerVisitChartHelper.formatTick,
      mode: 'hits',
    });
  }

  /**
   * Formats a Y-axis tick.
   *
   * @description Wraps `StatisticsBucketFormatter.decimal` so the tick index Recharts passes
   *   as second argument is not taken as a locale.
   * @param {number} value - The tick value.
   * @returns {string} The formatted number.
   */
  static formatTick(value) {
    return StatisticsBucketFormatter.decimal(value);
  }
}
