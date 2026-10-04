import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import VisitorsChartTooltip from '../VisitorsChartTooltip.jsx';
import { NEW_RETURNING_SERIES, chartSeries } from './chartSeries.js';

const AXIS_STROKE = 'var(--majora-chart-axis)';
const LABEL_PREFIX = 'staff_statistics_page.visitors';
const KEYS = NEW_RETURNING_SERIES.map(({ key }) => key);

/**
 * Rendering helper for the `VisitorsNewReturningChart` component.
 */
export default class VisitorsNewReturningChartHelper {
  /**
   * Renders the stacked new vs returning visitors bar chart.
   *
   * @description Builds the Recharts tree in a fixed order: grid, axes, tooltip, legend and
   *   one stacked bar per series (`new_visitors` at the bottom, then `returning_visitors`);
   *   both series are always shown.
   * @param {object[]} points - Chart points (see `VisitorsController.map`).
   * @returns {React.ReactElement} The `BarChart` element.
   */
  static render(points) {
    return (
      <BarChart data={points}>
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis dataKey="label" stroke={AXIS_STROKE} />
        <YAxis allowDecimals={false} stroke={AXIS_STROKE} />
        <Tooltip content={<VisitorsChartTooltip mode="newReturning" />} />
        <Legend />
        {chartSeries(NEW_RETURNING_SERIES, KEYS, LABEL_PREFIX).map(VisitorsNewReturningChartHelper.#renderBar)}
      </BarChart>
    );
  }

  static #renderBar({ key, color, label }) {
    return (
      <Bar
        key={key}
        dataKey={key}
        stackId="new-returning"
        fill={color}
        name={label}
        isAnimationActive={false}
      />
    );
  }
}
