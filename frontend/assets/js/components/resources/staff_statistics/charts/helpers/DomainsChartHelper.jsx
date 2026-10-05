import {
  Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts';
import DomainsChartTooltip from '../DomainsChartTooltip.jsx';
import { AUDIENCE_SERIES, chartSeries } from './chartSeries.js';

const AXIS_STROKE = 'var(--majora-chart-axis)';
const LABEL_PREFIX = 'staff_statistics_page.domains';
const LABEL_WIDTH = 160;

/**
 * Rendering helper for the `DomainsChart` component.
 */
export default class DomainsChartHelper {
  /**
   * Renders the horizontal stacked visits-per-domain bar chart.
   *
   * @description Builds a `layout="vertical"` Recharts tree in a fixed order: grid, the
   *   numeric `XAxis`, the category `YAxis` (domain labels, first row at the top), tooltip,
   *   legend and one stacked bar per visible series (`anonymous` first, then `logged_in`),
   *   so each bar's length is the domain's visits.
   * @param {object[]} rows - Domain rows in API order (see `DomainsController.map`).
   * @param {{series: string[]}} options - Visible series keys.
   * @returns {React.ReactElement} The `BarChart` element.
   */
  static render(rows, { series }) {
    return (
      <BarChart data={rows} layout="vertical">
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis type="number" allowDecimals={false} stroke={AXIS_STROKE} />
        <YAxis type="category" dataKey="label" width={LABEL_WIDTH} stroke={AXIS_STROKE} />
        <Tooltip content={<DomainsChartTooltip series={series} />} />
        <Legend />
        {chartSeries(AUDIENCE_SERIES, series, LABEL_PREFIX).map(DomainsChartHelper.#renderBar)}
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
