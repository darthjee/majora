import { ResponsiveContainer } from 'recharts';
import VisitsChartHelper from './helpers/VisitsChartHelper.jsx';

/**
 * Responsive stacked bar chart of the Visits tab (issue #1507).
 *
 * @description Wraps the helper's `BarChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-visits-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.points - Chart points (see `VisitsController.map`).
 * @param {string[]} props.series - Visible series keys (`anonymous` and/or `logged_in`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function VisitsChart({ points, series }) {
  return (
    <div data-testid="statistics-visits-chart">
      <ResponsiveContainer width="100%" height={300}>
        {VisitsChartHelper.render(points, { series })}
      </ResponsiveContainer>
    </div>
  );
}
