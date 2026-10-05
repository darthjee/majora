import DurationChartTooltipHelper from './helpers/DurationChartTooltipHelper.jsx';

/**
 * Tooltip content of both Duration tab line charts (issue #1514).
 *
 * @description Recharts passes `active` and `payload`; renders nothing while inactive or
 *   without a payload, otherwise the hovered bucket's range, metrics, visits and share.
 * @param {object} props - Component props.
 * @param {boolean} [props.active] - Whether the tooltip is active (set by Recharts).
 * @param {object[]} [props.payload] - Hovered entries (set by Recharts); each carries the point.
 * @param {string} props.mode - Chart mode: `duration` or `hits`.
 * @returns {React.ReactElement|null} The tooltip card, or `null`.
 */
export default function DurationChartTooltip({ active, payload, mode }) {
  if (!active || !payload || payload.length === 0) return null;

  return DurationChartTooltipHelper.render(payload[0].payload, { mode });
}
