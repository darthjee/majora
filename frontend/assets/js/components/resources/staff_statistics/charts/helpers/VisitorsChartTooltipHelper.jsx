import Translator from '../../../../../i18n/Translator.js';
import StatisticsBucketFormatter from '../../pages/helpers/StatisticsBucketFormatter.js';
import { AUDIENCE_SERIES, NEW_RETURNING_SERIES, chartSeries } from './chartSeries.js';

const LABEL_PREFIX = 'staff_statistics_page.visitors';
const t = (key) => Translator.t(`${LABEL_PREFIX}.${key}`);

const MODES = {
  newReturning: {
    definitions: NEW_RETURNING_SERIES, shareKey: 'returning_share', shareField: 'returningShare',
  },
  audience: {
    definitions: AUDIENCE_SERIES, shareKey: 'logged_in_share', shareField: 'loggedInShare',
  },
};

/**
 * Rendering helper for the `VisitorsChartTooltip` component.
 */
export default class VisitorsChartTooltipHelper {
  /**
   * Renders the tooltip card of a hovered bucket.
   *
   * @description Shows the bucket's date range, one line per visible series, the unique
   *   visitors total and the mode's share: the returning share (`newReturning` mode) or the
   *   logged-in share (`audience` mode). The share is only shown when both series are
   *   visible and the bucket has visitors (share not `null`).
   * @param {object} point - The hovered chart point (see `VisitorsController.map`).
   * @param {{mode: string, series: (string[]|undefined)}} options - Chart mode
   *   (`newReturning` or `audience`) and, for `audience`, the visible series keys
   *   (defaults to every series of the mode).
   * @returns {React.ReactElement} The tooltip card.
   */
  static render(point, { mode, series }) {
    const config = MODES[mode];
    const visible = chartSeries(
      config.definitions, series || config.definitions.map(({ key }) => key), LABEL_PREFIX,
    );

    return (
      <div className="bg-body border rounded p-2 small" data-testid="statistics-visitors-tooltip">
        <div className="fw-bold">{StatisticsBucketFormatter.range(point.start, point.end)}</div>
        {visible.map(({ key, label }) => (
          <div key={key}>{`${label}: ${StatisticsBucketFormatter.count(point[key])}`}</div>
        ))}
        <div>{`${t('total')}: ${StatisticsBucketFormatter.count(point.unique_visitors)}`}</div>
        {VisitorsChartTooltipHelper.#renderShare(point, config, visible.length)}
      </div>
    );
  }

  static #renderShare(point, { shareKey, shareField }, visibleCount) {
    const value = point[shareField];
    if (visibleCount < 2 || value === null) return null;

    return <div>{`${t(shareKey)}: ${StatisticsBucketFormatter.percent(value)}`}</div>;
  }
}
