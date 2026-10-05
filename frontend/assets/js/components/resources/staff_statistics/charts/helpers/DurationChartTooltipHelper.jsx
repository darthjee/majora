import Translator from '../../../../../i18n/Translator.js';
import StatisticsBucketFormatter from '../../pages/helpers/StatisticsBucketFormatter.js';
import StatisticsDurationFormatter from '../../pages/helpers/StatisticsDurationFormatter.js';
import { DURATION_SERIES, HITS_SERIES, chartSeries } from './chartSeries.js';

const LABEL_PREFIX = 'staff_statistics_page.duration';
const EMPTY = '—';
const t = (key) => Translator.t(`${LABEL_PREFIX}.${key}`);

/**
 * Formats a hits value, `—` when missing.
 *
 * @param {?number} value - The hits value.
 * @returns {string} The formatted value.
 */
function formatHits(value) {
  return value === null || value === undefined ? EMPTY : StatisticsBucketFormatter.decimal(value);
}

const MODES = {
  duration: { definitions: DURATION_SERIES, format: StatisticsDurationFormatter.format },
  hits: { definitions: HITS_SERIES, format: formatHits },
};

/**
 * Rendering helper for the `DurationChartTooltip` component (issue #1514).
 */
export default class DurationChartTooltipHelper {
  /**
   * Renders the tooltip card of a hovered bucket.
   *
   * @description Shows the bucket's date range, the mode's average and median (durations as
   *   `Xm Ys`, hits with at most one decimal, `—` when missing), the visits and the
   *   single-hit share (hidden for a bucket without visits).
   * @param {object} point - The hovered chart point (see `DurationController.map`).
   * @param {{mode: string}} options - Chart mode (`duration` or `hits`).
   * @returns {React.ReactElement} The tooltip card.
   */
  static render(point, { mode }) {
    const { definitions, format } = MODES[mode];
    const series = chartSeries(definitions, definitions.map(({ key }) => key), LABEL_PREFIX);

    return (
      <div className="bg-body border rounded p-2 small" data-testid="statistics-duration-tooltip">
        <div className="fw-bold">{StatisticsBucketFormatter.range(point.start, point.end)}</div>
        {series.map(({ key, label }) => <div key={key}>{`${label}: ${format(point[key])}`}</div>)}
        <div>{`${t('visits')}: ${StatisticsBucketFormatter.count(point.visits)}`}</div>
        {DurationChartTooltipHelper.#renderShare(point.singleHitShare)}
      </div>
    );
  }

  static #renderShare(value) {
    if (value === null || value === undefined) return null;

    return <div>{`${t('single_hit_share')}: ${StatisticsBucketFormatter.percent(value)}`}</div>;
  }
}
