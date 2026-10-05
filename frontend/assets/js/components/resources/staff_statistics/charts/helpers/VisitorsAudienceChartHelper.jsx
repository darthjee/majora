import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import VisitorsChartTooltip from '../VisitorsChartTooltip.jsx';
import { AUDIENCE_SERIES, chartSeries } from './chartSeries.js';

const AXIS_STROKE = 'var(--majora-chart-axis)';
const LABEL_PREFIX = 'staff_statistics_page.visitors';

/**
 * Rendering helper for the `VisitorsAudienceChart` component.
 */
export default class VisitorsAudienceChartHelper {
  /**
   * Renders the stacked anonymous vs logged-in visitors bar chart.
   *
   * @description Builds the Recharts tree in a fixed order: grid, axes, tooltip, legend and
   *   one stacked bar per visible series (`anonymous` at the bottom, then `logged_in`).
   * @param {object[]} points - Chart points (see `VisitorsController.map`).
   * @param {{series: string[]}} options - Visible series keys.
   * @returns {React.ReactElement} The `BarChart` element.
   */
  static render(points, { series }) {
    return (
      <BarChart data={points}>
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis dataKey="label" stroke={AXIS_STROKE} />
        <YAxis allowDecimals={false} stroke={AXIS_STROKE} />
        <Tooltip content={<VisitorsChartTooltip mode="audience" series={series} />} />
        <Legend />
        {chartSeries(AUDIENCE_SERIES, series, LABEL_PREFIX).map(VisitorsAudienceChartHelper.#renderBar)}
      </BarChart>
    );
  }

  static #renderBar({ key, color, label }) {
    return (
      <Bar
        key={key}
        dataKey={key}
        stackId="audience"
        fill={color}
        name={label}
        isAnimationActive={false}
      />
    );
  }
}
