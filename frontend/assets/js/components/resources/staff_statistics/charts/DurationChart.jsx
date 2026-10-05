import { ResponsiveContainer } from 'recharts';
import DurationChartHelper from './helpers/DurationChartHelper.jsx';

/**
 * Responsive average vs median visit duration line chart of the Duration tab (issue #1514).
 *
 * @description Wraps the helper's `LineChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-duration-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.points - Chart points (see `DurationController.map`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function DurationChart({ points }) {
  return (
    <div data-testid="statistics-duration-chart">
      <ResponsiveContainer width="100%" height={300}>
        {DurationChartHelper.render(points)}
      </ResponsiveContainer>
    </div>
  );
}
