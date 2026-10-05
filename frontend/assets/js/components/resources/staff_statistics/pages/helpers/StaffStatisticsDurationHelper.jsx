import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffStatisticsCharts from '../elements/StaffStatisticsCharts.jsx';
import StatisticsKpiTile from '../elements/StatisticsKpiTile.jsx';
import StatisticsBucketFormatter from './StatisticsBucketFormatter.js';
import StatisticsDurationFormatter from './StatisticsDurationFormatter.js';

const EMPTY = '—';
const t = (key) => Translator.t(`staff_statistics_page.duration.${key}`);

/**
 * Formats a hits value, `—` when missing.
 *
 * @param {?number} value - The hits value.
 * @returns {string} The formatted value.
 */
function formatHits(value) {
  return value === null || value === undefined ? EMPTY : StatisticsBucketFormatter.decimal(value);
}

/**
 * Rendering helper of the Duration tab body (issue #1514).
 */
export default class StaffStatisticsDurationHelper {
  /**
   * Renders the tab body for the current load state.
   *
   * @param {object} state - Load state.
   * @param {object|null} state.data - Mapped data (see `DurationController.map`).
   * @param {boolean} state.loading - Whether the durations are loading.
   * @param {string|null} state.error - Error message, if loading failed.
   * @returns {React.ReactElement} The loading message, the error alert or the charts.
   */
  static renderState({ data, loading, error }) {
    if (loading) return <LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />;
    if (error) return <ErrorAlert error={error} />;

    return StaffStatisticsDurationHelper.render(data);
  }

  /**
   * Renders the loaded Duration tab: title, totals tiles, empty note and the three charts.
   *
   * @description The tiles show the range totals (visits, average and median duration,
   *   average hits and, when there are visits, the single-hit share). The empty note is
   *   shown when the range has no visits; the charts are drawn anyway.
   * @param {object} data - Mapped data (see `DurationController.map`).
   * @returns {React.ReactElement} The rendered tab content.
   */
  static render(data) {
    return (
      <section className="mt-3" data-testid="statistics-duration">
        <h2 className="h5">{t('title')}</h2>
        {StaffStatisticsDurationHelper.#renderTiles(data.totals)}
        {StaffStatisticsDurationHelper.#renderEmpty(data)}
        <h3 className="h6">{t('duration_chart')}</h3>
        <StaffStatisticsCharts chart="DurationChart" points={data.points} />
        <h3 className="h6">{t('hits_chart')}</h3>
        <StaffStatisticsCharts chart="HitsPerVisitChart" points={data.points} />
        <h3 className="h6">{t('histogram_chart')}</h3>
        <StaffStatisticsCharts chart="DurationHistogramChart" bins={data.bins} />
      </section>
    );
  }

  static #renderTiles(totals) {
    const duration = StatisticsDurationFormatter.format;

    return (
      <div className="row">
        {StaffStatisticsDurationHelper.#renderTile('visits', StatisticsBucketFormatter.count(totals.visits))}
        {StaffStatisticsDurationHelper.#renderTile('average_duration', duration(totals.average_duration_seconds))}
        {StaffStatisticsDurationHelper.#renderTile('median_duration', duration(totals.median_duration_seconds))}
        {StaffStatisticsDurationHelper.#renderTile('average_hits', formatHits(totals.average_hits))}
        {StaffStatisticsDurationHelper.#renderShareTile(totals)}
      </div>
    );
  }

  static #renderTile(key, value) {
    return <StatisticsKpiTile key={key} label={t(key)} value={value} testId={`statistics-duration-${key}`} />;
  }

  static #renderShareTile({ visits, singleHitShare }) {
    if (visits === 0) return null;

    return StaffStatisticsDurationHelper.#renderTile(
      'single_hit_share', StatisticsBucketFormatter.percent(singleHitShare),
    );
  }

  static #renderEmpty({ empty }) {
    if (!empty) return null;

    return <p className="text-muted" data-testid="statistics-duration-empty">{t('empty')}</p>;
  }
}
