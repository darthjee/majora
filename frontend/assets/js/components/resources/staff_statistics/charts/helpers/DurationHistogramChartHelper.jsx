import {
  Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis,
} from 'recharts';
import Translator from '../../../../../i18n/Translator.js';
import DurationHistogramTooltip from '../DurationHistogramTooltip.jsx';

const AXIS_STROKE = 'var(--majora-chart-axis)';
const LABEL_PREFIX = 'staff_statistics_page.duration';

/**
 * Rendering helper for the `DurationHistogramChart` component (issue #1514).
 */
export default class DurationHistogramChartHelper {
  /**
   * Renders the visit duration histogram.
   *
   * @description Translates each bin's `labelKey` on every render (so labels follow the
   *   current locale), then builds the Recharts tree in a fixed order: grid, axes, tooltip
   *   and a single visits bar (no legend, as there is only one series).
   * @param {object[]} bins - Histogram bins (see `DurationController.map`).
   * @returns {React.ReactElement} The `BarChart` element.
   */
  static render(bins) {
    return (
      <BarChart data={DurationHistogramChartHelper.labelBins(bins)}>
        <CartesianGrid stroke="var(--majora-chart-grid)" />
        <XAxis dataKey="label" stroke={AXIS_STROKE} />
        <YAxis allowDecimals={false} stroke={AXIS_STROKE} />
        <Tooltip content={<DurationHistogramTooltip />} />
        <Bar
          dataKey="count"
          fill="var(--majora-chart-3)"
          name={Translator.t(`${LABEL_PREFIX}.visits`)}
          isAnimationActive={false}
        />
      </BarChart>
    );
  }

  /**
   * Adds the translated label to each bin.
   *
   * @param {object[]} bins - Histogram bins carrying a `labelKey`.
   * @returns {object[]} The bins with a `label`.
   */
  static labelBins(bins) {
    return bins.map((bin) => ({ ...bin, label: Translator.t(`${LABEL_PREFIX}.bins.${bin.labelKey}`) }));
  }
}
