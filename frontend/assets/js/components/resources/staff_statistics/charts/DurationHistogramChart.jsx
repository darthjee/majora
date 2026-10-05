import { ResponsiveContainer } from 'recharts';
import DurationHistogramChartHelper from './helpers/DurationHistogramChartHelper.jsx';

/**
 * Responsive visit duration histogram of the Duration tab (issue #1514).
 *
 * @description Wraps the helper's `BarChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-duration-histogram-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {object[]} props.bins - Histogram bins (see `DurationController.map`).
 * @returns {React.ReactElement} The rendered chart.
 */
export default function DurationHistogramChart({ bins }) {
  return (
    <div data-testid="statistics-duration-histogram-chart">
      <ResponsiveContainer width="100%" height={300}>
        {DurationHistogramChartHelper.render(bins)}
      </ResponsiveContainer>
    </div>
  );
}
