import Translator from '../../../../../i18n/Translator.js';
import StatisticsBucketFormatter from '../../pages/helpers/StatisticsBucketFormatter.js';
import { AUDIENCE_SERIES, chartSeries } from './chartSeries.js';

const LABEL_PREFIX = 'staff_statistics_page.visits';
const t = (key) => Translator.t(`${LABEL_PREFIX}.${key}`);

/**
 * Rendering helper for the `VisitsChartTooltip` component.
 */
export default class VisitsChartTooltipHelper {
  /**
   * Renders the tooltip card of a hovered bucket.
   *
   * @description Shows the bucket's date range, one line per visible series, the total and,
   *   only when both series are visible and the bucket has visits, the logged-in share.
   * @param {object} point - The hovered chart point (see `VisitsController.map`).
   * @param {string[]} series - Visible series keys.
   * @returns {React.ReactElement} The tooltip card.
   */
  static render(point, series) {
    return (
      <div className="bg-body border rounded p-2 small" data-testid="statistics-visits-tooltip">
        <div className="fw-bold">{StatisticsBucketFormatter.range(point.start, point.end)}</div>
        {chartSeries(AUDIENCE_SERIES, series, LABEL_PREFIX).map(({ key, label }) => (
          <div key={key}>{`${label}: ${StatisticsBucketFormatter.count(point[key])}`}</div>
        ))}
        <div>{`${t('total')}: ${StatisticsBucketFormatter.count(point.visits)}`}</div>
        {VisitsChartTooltipHelper.#renderShare(point, series)}
      </div>
    );
  }

  static #renderShare(point, series) {
    if (series.length < 2 || point.loggedInShare === null) return null;

    return (
      <div>{`${t('logged_in_share')}: ${StatisticsBucketFormatter.percent(point.loggedInShare)}`}</div>
    );
  }
}
