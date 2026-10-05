import { ResponsiveContainer } from 'recharts';
import VisitorsNewReturningChartHelper from './helpers/VisitorsNewReturningChartHelper.jsx';

/**
 * Responsive stacked new vs returning visitors bar chart of the Visitors tab (issue #1510).
 *
 * @description Wraps the helper's `BarChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-visitors-new-returning-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.points - Chart points (see `VisitorsController.map`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function VisitorsNewReturningChart({ points }) {
  return (
    <div data-testid="statistics-visitors-new-returning-chart">
      <ResponsiveContainer width="100%" height={300}>
        {VisitorsNewReturningChartHelper.render(points)}
      </ResponsiveContainer>
    </div>
  );
}
