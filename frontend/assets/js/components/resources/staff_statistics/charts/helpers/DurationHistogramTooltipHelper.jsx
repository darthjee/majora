import Translator from '../../../../../i18n/Translator.js';
import StatisticsBucketFormatter from '../../pages/helpers/StatisticsBucketFormatter.js';

const t = (key) => Translator.t(`staff_statistics_page.duration.${key}`);

/**
 * Rendering helper for the `DurationHistogramTooltip` component (issue #1514).
 */
export default class DurationHistogramTooltipHelper {
  /**
   * Renders the tooltip card of a hovered histogram bin.
   *
   * @description Shows the bin's (translated) label, its visits and its share of the visits
   *   in range (hidden when there are no visits).
   * @param {object} bin - The hovered bin (see `DurationHistogramChartHelper.render`).
   * @returns {React.ReactElement} The tooltip card.
   */
  static render(bin) {
    return (
      <div className="bg-body border rounded p-2 small" data-testid="statistics-duration-histogram-tooltip">
        <div className="fw-bold">{bin.label}</div>
        <div>{`${t('visits')}: ${StatisticsBucketFormatter.count(bin.count)}`}</div>
        {DurationHistogramTooltipHelper.#renderShare(bin.share)}
      </div>
    );
  }

  static #renderShare(value) {
    if (value === null || value === undefined) return null;

    return <div>{`${t('histogram_share')}: ${StatisticsBucketFormatter.percent(value)}`}</div>;
  }
}
