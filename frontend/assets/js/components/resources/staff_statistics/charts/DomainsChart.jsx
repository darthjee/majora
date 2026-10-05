import { ResponsiveContainer } from 'recharts';
import DomainsChartHelper from './helpers/DomainsChartHelper.jsx';

const MIN_HEIGHT = 300;
const ROW_HEIGHT = 32;
const PADDING = 60;

/**
 * Responsive horizontal stacked visits-per-domain bar chart of the Domains tab (issue #1517).
 *
 * @description Wraps the helper's `BarChart` in a full-width `ResponsiveContainer` whose
 *   height grows with the row count (`max(300, rows × 32 + 60)` px) so every domain label
 *   stays readable, inside a `statistics-domains-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.rows - Domain rows in API order (see `DomainsController.map`).
 * @param {string[]} props.series - Visible series keys (`anonymous` and/or `logged_in`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function DomainsChart({ rows, series }) {
  const height = Math.max(MIN_HEIGHT, rows.length * ROW_HEIGHT + PADDING);

  return (
    <div data-testid="statistics-domains-chart">
      <ResponsiveContainer width="100%" height={height}>
        {DomainsChartHelper.render(rows, { series })}
      </ResponsiveContainer>
    </div>
  );
}
