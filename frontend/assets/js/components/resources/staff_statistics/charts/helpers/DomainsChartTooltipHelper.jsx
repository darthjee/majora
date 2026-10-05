import Translator from '../../../../../i18n/Translator.js';
import StatisticsBucketFormatter from '../../pages/helpers/StatisticsBucketFormatter.js';
import { AUDIENCE_SERIES, chartSeries } from './chartSeries.js';

const LABEL_PREFIX = 'staff_statistics_page.domains';
const t = (key) => Translator.t(`${LABEL_PREFIX}.${key}`);

/**
 * Rendering helper for the `DomainsChartTooltip` component.
 */
export default class DomainsChartTooltipHelper {
  /**
   * Renders the tooltip card of a hovered domain row.
   *
   * @description Shows the domain label, its group (omitted for the "unknown" row or a
   *   missing group), one line per visible series, the total visits and the logged-in share.
   *   The share is only shown when both series are visible (audience `all`) and the row has
   *   visits (share not `null`).
   * @param {object} row - The hovered domain row (see `DomainsController.map`).
   * @param {{series: (string[]|undefined)}} options - Visible series keys (defaults to both).
   * @returns {React.ReactElement} The tooltip card.
   */
  static render(row, { series }) {
    const visible = chartSeries(
      AUDIENCE_SERIES, series || AUDIENCE_SERIES.map(({ key }) => key), LABEL_PREFIX,
    );

    return (
      <div className="bg-body border rounded p-2 small" data-testid="statistics-domains-tooltip">
        <div className="fw-bold">{row.label}</div>
        {DomainsChartTooltipHelper.#renderGroup(row)}
        {visible.map(({ key, label }) => (
          <div key={key}>{`${label}: ${StatisticsBucketFormatter.count(row[key])}`}</div>
        ))}
        <div>{`${t('total')}: ${StatisticsBucketFormatter.count(row.visits)}`}</div>
        {DomainsChartTooltipHelper.#renderShare(row, visible.length)}
      </div>
    );
  }

  static #renderGroup({ unknown, group }) {
    if (unknown || !group) return null;

    return <div>{`${t('group')}: ${group}`}</div>;
  }

  static #renderShare({ loggedInShare }, visibleCount) {
    if (visibleCount < 2 || loggedInShare === null) return null;

    return <div>{`${t('logged_in_share')}: ${StatisticsBucketFormatter.percent(loggedInShare)}`}</div>;
  }
}
