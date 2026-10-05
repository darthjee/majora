import VisitorsChartTooltipHelper from './helpers/VisitorsChartTooltipHelper.jsx';

/**
 * Tooltip content of both Visitors charts.
 *
 * @description Recharts passes `active` and `payload`; renders nothing while inactive or
 *   without a payload, otherwise the hovered bucket's range, counts and share.
 * @param {object} props - Component props.
 * @param {boolean} [props.active] - Whether the tooltip is active (set by Recharts).
 * @param {object[]} [props.payload] - Hovered entries (set by Recharts); each carries the point.
 * @param {string} props.mode - Chart mode: `newReturning` or `audience`.
 * @param {string[]} [props.series] - Visible audience series keys (`audience` mode only).
 * @returns {React.ReactElement|null} The tooltip card, or `null`.
 */
export default function VisitorsChartTooltip({
  active, payload, mode, series,
}) {
  if (!active || !payload || payload.length === 0) return null;

  return VisitorsChartTooltipHelper.render(payload[0].payload, { mode, series });
}
