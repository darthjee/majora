import VisitsChartTooltipHelper from './helpers/VisitsChartTooltipHelper.jsx';

/**
 * Tooltip content of the Visits chart.
 *
 * @description Recharts passes `active` and `payload`; renders nothing while inactive or
 *   without a payload, otherwise the hovered bucket's range and counts.
 * @param {object} props - Component props.
 * @param {boolean} [props.active] - Whether the tooltip is active (set by Recharts).
 * @param {object[]} [props.payload] - Hovered entries (set by Recharts); each carries the point.
 * @param {string[]} props.series - Visible series keys.
 * @returns {React.ReactElement|null} The tooltip card, or `null`.
 */
export default function VisitsChartTooltip({ active, payload, series }) {
  if (!active || !payload || payload.length === 0) return null;

  return VisitsChartTooltipHelper.render(payload[0].payload, series);
}
