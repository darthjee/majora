import { ResponsiveContainer } from 'recharts';
import HitsPerVisitChartHelper from './helpers/HitsPerVisitChartHelper.jsx';

/**
 * Responsive average vs median hits per visit line chart of the Duration tab (issue #1514).
 *
 * @description Wraps the helper's `LineChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-hits-per-visit-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.points - Chart points (see `DurationController.map`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function HitsPerVisitChart({ points }) {
  return (
    <div data-testid="statistics-hits-per-visit-chart">
      <ResponsiveContainer width="100%" height={300}>
        {HitsPerVisitChartHelper.render(points)}
      </ResponsiveContainer>
    </div>
  );
}
