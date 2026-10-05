import StatisticsDurationFormatter from '../../pages/helpers/StatisticsDurationFormatter.js';
import { DURATION_SERIES } from './chartSeries.js';
import MetricLineChartHelper from './MetricLineChartHelper.jsx';

/**
 * Rendering helper for the `DurationChart` component (issue #1514).
 */
export default class DurationChartHelper {
  /**
   * Renders the average vs median visit duration line chart.
   *
   * @description Delegates to `MetricLineChartHelper` with the duration series, a Y axis
   *   formatted by `StatisticsDurationFormatter.format` and the `duration` tooltip mode.
   * @param {object[]} points - Chart points (see `DurationController.map`).
   * @returns {React.ReactElement} The `LineChart` element.
   */
  static render(points) {
    return MetricLineChartHelper.render(points, {
      definitions: DURATION_SERIES,
      tickFormatter: DurationChartHelper.formatTick,
      mode: 'duration',
    });
  }

  /**
   * Formats a Y-axis tick.
   *
   * @param {number} value - The tick value, in seconds.
   * @returns {string} The formatted duration.
   */
  static formatTick(value) {
    return StatisticsDurationFormatter.format(value);
  }
}
