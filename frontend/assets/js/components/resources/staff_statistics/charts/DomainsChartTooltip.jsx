import DomainsChartTooltipHelper from './helpers/DomainsChartTooltipHelper.jsx';

/**
 * Tooltip content of the Domains chart (issue #1517).
 *
 * @description Recharts passes `active` and `payload`; renders nothing while inactive or
 *   without a payload, otherwise the hovered domain's label, group, counts and share.
 * @param {object} props - Component props.
 * @param {boolean} [props.active] - Whether the tooltip is active (set by Recharts).
 * @param {object[]} [props.payload] - Hovered entries (set by Recharts); each carries the row.
 * @param {string[]} [props.series] - Visible series keys.
 * @returns {React.ReactElement|null} The tooltip card, or `null`.
 */
export default function DomainsChartTooltip({ active, payload, series }) {
  if (!active || !payload || payload.length === 0) return null;

  return DomainsChartTooltipHelper.render(payload[0].payload, { series });
}
