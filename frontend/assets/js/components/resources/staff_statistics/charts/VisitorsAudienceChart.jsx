import { ResponsiveContainer } from 'recharts';
import VisitorsAudienceChartHelper from './helpers/VisitorsAudienceChartHelper.jsx';

/**
 * Responsive stacked anonymous vs logged-in visitors bar chart of the Visitors tab
 * (issue #1510).
 *
 * @description Wraps the helper's `BarChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-visitors-audience-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.points - Chart points (see `VisitorsController.map`).
 * @param {string[]} props.series - Visible series keys (`anonymous` and/or `logged_in`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function VisitorsAudienceChart({ points, series }) {
  return (
    <div data-testid="statistics-visitors-audience-chart">
      <ResponsiveContainer width="100%" height={300}>
        {VisitorsAudienceChartHelper.render(points, { series })}
      </ResponsiveContainer>
    </div>
  );
}
