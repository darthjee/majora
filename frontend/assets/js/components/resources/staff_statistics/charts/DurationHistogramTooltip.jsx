import DurationHistogramTooltipHelper from './helpers/DurationHistogramTooltipHelper.jsx';

/**
 * Tooltip content of the Duration tab histogram (issue #1514).
 *
 * @description Recharts passes `active` and `payload`; renders nothing while inactive or
 *   without a payload, otherwise the hovered bin's label, visits and share.
 * @param {object} props - Component props.
 * @param {boolean} [props.active] - Whether the tooltip is active (set by Recharts).
 * @param {object[]} [props.payload] - Hovered entries (set by Recharts); each carries the bin.
 * @returns {React.ReactElement|null} The tooltip card, or `null`.
 */
export default function DurationHistogramTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  return DurationHistogramTooltipHelper.render(payload[0].payload);
}
