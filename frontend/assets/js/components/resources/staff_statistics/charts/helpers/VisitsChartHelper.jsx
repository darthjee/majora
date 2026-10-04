import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import VisitsChartTooltip from '../VisitsChartTooltip.jsx';
import visitsSeries from './visitsSeries.js';

const AXIS_STROKE = 'var(--majora-chart-axis)';

/**
 * Rendering helper for the `VisitsChart` component.
 */
export default class VisitsChartHelper {
  /**
   * Renders the stacked visits bar chart.
   *
   * @description Builds the Recharts tree in a fixed order: grid, axes, tooltip, legend
   *   and one stacked bar per visible series (`anonymous` at the bottom, then `logged_in`).
   * @param {object[]} points - Chart points (see `VisitsController.map`).
   * @param {{series: string[]}} options - Visible series keys.
   * @returns {React.ReactElement} The `BarChart` element.
   */
  static render(points, { series }) {
    return (
      <BarChart data={points}>
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis dataKey="label" stroke={AXIS_STROKE} />
        <YAxis allowDecimals={false} stroke={AXIS_STROKE} />
        <Tooltip content={<VisitsChartTooltip series={series} />} />
        <Legend />
        {visitsSeries(series).map(VisitsChartHelper.#renderBar)}
      </BarChart>
    );
  }

  static #renderBar({ key, color, label }) {
    return (
      <Bar
        key={key}
        dataKey={key}
        stackId="visits"
        fill={color}
        name={label}
        isAnimationActive={false}
      />
    );
  }
}
