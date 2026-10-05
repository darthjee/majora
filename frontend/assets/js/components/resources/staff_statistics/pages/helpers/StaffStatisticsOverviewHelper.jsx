import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StatisticsKpiTile from '../elements/StatisticsKpiTile.jsx';
import StatisticsBucketFormatter from './StatisticsBucketFormatter.js';
import StatisticsDurationFormatter from './StatisticsDurationFormatter.js';
import StatisticsTabs from './StatisticsTabs.js';
import statisticsHref from './statisticsHref.js';

const t = (key) => Translator.t(`staff_statistics_page.overview.${key}`);
const count = (value) => StatisticsBucketFormatter.count(value);

/**
 * Builds the hash link of a tab carrying the current filters.
 *
 * @param {string} tab - Tab key (e.g. `visits`).
 * @param {object} filters - Current statistics filters.
 * @returns {string} The `#`-prefixed tab link.
 */
function tabHref(tab, filters) {
  return `#${statisticsHref(StatisticsTabs.find(tab).path, filters)}`;
}

/**
 * Rendering helper of the Overview tab body (issue #1504).
 */
export default class StaffStatisticsOverviewHelper {
  /**
   * Renders the tab body for the current load state.
   *
   * @param {object} state - Load state.
   * @param {object|null} state.data - Mapped data (see `OverviewController.map`).
   * @param {boolean} state.loading - Whether the overview is loading.
   * @param {string|null} state.error - Error message, if loading failed.
   * @param {object} filters - Current statistics filters, carried into the tile links.
   * @returns {React.ReactElement} The loading message, the error alert or the tiles.
   */
  static renderState({ data, loading, error }, filters) {
    if (loading) return <LoadingMessage message={t('loading')} />;
    if (error) return <ErrorAlert error={error} />;

    return StaffStatisticsOverviewHelper.render(data, filters);
  }

  /**
   * Renders the five KPI tiles: visits, unique visitors, logged-in users, average visit
   * duration and new vs returning.
   *
   * @description Each tile links to its detail tab (Visits, Visitors, Users, Duration,
   *   Visitors), keeping the current filters.
   * @param {object} data - Mapped data (see `OverviewController.map`).
   * @param {object} filters - Current statistics filters, carried into the tile links.
   * @returns {React.ReactElement} The rendered tab content.
   */
  static render(data, filters) {
    const { totals } = data;
    const tile = (key, tab, value) => (
      <StatisticsKpiTile
        label={t(key)}
        value={value}
        href={tabHref(tab, filters)}
        testId={`statistics-overview-${key}`}
      />
    );

    return (
      <section className="mt-3" data-testid="statistics-overview">
        <div className="row">
          {tile('visits', 'visits', count(totals.visits))}
          {tile('unique_visitors', 'visitors', count(totals.unique_visitors))}
          {tile('logged_in_users', 'users', count(totals.logged_in_users))}
          {tile('average_duration', 'duration', StatisticsDurationFormatter.format(totals.average_duration_seconds))}
          {StaffStatisticsOverviewHelper.#renderNewVsReturning(data, filters)}
        </div>
      </section>
    );
  }

  static #renderNewVsReturning({ totals, returningShare }, filters) {
    return (
      <StatisticsKpiTile
        label={t('new_vs_returning')}
        value={`${count(totals.new_visitors)} / ${count(totals.returning_visitors)}`}
        href={tabHref('visitors', filters)}
        testId="statistics-overview-new_vs_returning"
      >
        <p className="mb-0">{t('new_visitors').replace('{{count}}', count(totals.new_visitors))}</p>
        <p className="mb-0">{t('returning_visitors').replace('{{count}}', count(totals.returning_visitors))}</p>
        {StaffStatisticsOverviewHelper.#renderShare(returningShare)}
        <p className="small text-muted mt-2 mb-0" data-testid="statistics-overview-first-visit-note">
          {t('first_visit_note')}
        </p>
      </StatisticsKpiTile>
    );
  }

  static #renderShare(returningShare) {
    if (returningShare === null) return null;

    return (
      <p className="mb-0" data-testid="statistics-overview-returning-share">
        {t('returning_share').replace('{{share}}', StatisticsBucketFormatter.percent(returningShare))}
      </p>
    );
  }
}
