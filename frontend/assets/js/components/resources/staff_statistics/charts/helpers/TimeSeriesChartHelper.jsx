import {
  CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,
} from 'recharts';

const AXIS_STROKE = 'var(--majora-chart-axis)';

/**
 * Rendering helper for the `TimeSeriesChart` component.
 */
export default class TimeSeriesChartHelper {
  /**
   * Renders a line chart with one line per series.
   *
   * @description Builds the Recharts tree in a fixed order: grid, axes, tooltip,
   *   legend (only for more than one series) and lines.
   * @param {object[]} points - Data points, one object per x value.
   * @param {{xKey: string, series: {dataKey: string, color: string, label: string}[]}} options -
   *   Key of the x value in each point and the series to draw (data key, CSS color
   *   such as `var(--majora-chart-1)` and legend/tooltip label).
   * @returns {React.ReactElement} The `LineChart` element.
   */
  static render(points, { xKey, series }) {
    return (
      <LineChart data={points}>
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis dataKey={xKey} stroke={AXIS_STROKE} />
        <YAxis stroke={AXIS_STROKE} />
        <Tooltip />
        {TimeSeriesChartHelper.#renderLegend(series)}
        {series.map(TimeSeriesChartHelper.#renderLine)}
      </LineChart>
    );
  }

  static #renderLegend(series) {
    if (series.length <= 1) return null;

    return <Legend />;
  }

  static #renderLine({ dataKey, color, label }) {
    return (
      <Line
        key={dataKey}
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        name={label}
        isAnimationActive={false}
        dot={false}
      />
    );
  }
}
