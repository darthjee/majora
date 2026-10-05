import {
  CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import DurationChartTooltip from '../DurationChartTooltip.jsx';
import { chartSeries } from './chartSeries.js';

const AXIS_STROKE = 'var(--majora-chart-axis)';
const LABEL_PREFIX = 'staff_statistics_page.duration';

/**
 * Shared rendering of the Duration tab's average vs median line charts (issue #1514).
 *
 * @description Used by `DurationChartHelper` and `HitsPerVisitChartHelper`, which only differ
 *   by their series, Y-axis tick formatter and tooltip mode.
 */
export default class MetricLineChartHelper {
  /**
   * Renders an average vs median line chart.
   *
   * @description Builds the Recharts tree in a fixed order: grid, axes, tooltip, legend and
   *   one line per series. Empty buckets (`null` values) are gaps (`connectNulls={false}`),
   *   and each line keeps a small dot so an isolated bucket between two gaps stays visible.
   * @param {object[]} points - Chart points (see `DurationController.map`).
   * @param {{definitions: object[], tickFormatter: Function, mode: string}} options - Series
   *   definitions (see `chartSeries`), Y-axis tick formatter and tooltip mode.
   * @returns {React.ReactElement} The `LineChart` element.
   */
  static render(points, { definitions, tickFormatter, mode }) {
    const series = chartSeries(definitions, definitions.map(({ key }) => key), LABEL_PREFIX);

    return (
      <LineChart data={points}>
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis dataKey="label" stroke={AXIS_STROKE} />
        <YAxis tickFormatter={tickFormatter} stroke={AXIS_STROKE} />
        <Tooltip content={<DurationChartTooltip mode={mode} />} />
        <Legend />
        {series.map(MetricLineChartHelper.#renderLine)}
      </LineChart>
    );
  }

  static #renderLine({ key, color, label }) {
    return (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        stroke={color}
        name={label}
        connectNulls={false}
        dot={{ r: 2 }}
        isAnimationActive={false}
      />
    );
  }
}
