import { ResponsiveContainer } from 'recharts';
import TimeSeriesChartHelper from './helpers/TimeSeriesChartHelper.jsx';

/**
 * Generic responsive time series line chart for the access statistics tabs.
 *
 * @description Wraps the helper's `LineChart` in a full-width, 300px tall
 *   `ResponsiveContainer`, inside a `statistics-<name>-chart` test id wrapper.
 * @param {object} props - Component props.
 * @param {string} props.name - Chart name, used in the `data-testid`.
 * @param {object[]} props.points - Data points, one object per x value.
 * @param {string} props.xKey - Key of the x value in each point.
 * @param {{dataKey: string, color: string, label: string}[]} props.series - Series to draw.
 * @returns {React.ReactElement} The rendered chart.
 */
export default function TimeSeriesChart({ name, points, xKey, series }) {
  return (
    <div data-testid={`statistics-${name}-chart`}>
      <ResponsiveContainer width="100%" height={300}>
        {TimeSeriesChartHelper.render(points, { xKey, series })}
      </ResponsiveContainer>
    </div>
  );
}
