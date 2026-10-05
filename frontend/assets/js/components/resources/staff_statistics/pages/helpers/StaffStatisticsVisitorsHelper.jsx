import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffStatisticsCharts from '../elements/StaffStatisticsCharts.jsx';
import StatisticsKpiTile from '../elements/StatisticsKpiTile.jsx';
import StatisticsBucketFormatter from './StatisticsBucketFormatter.js';

const t = (key) => Translator.t(`staff_statistics_page.visitors.${key}`);
const count = (value) => StatisticsBucketFormatter.count(value);

/**
 * Rendering helper of the Visitors tab body (issue #1510).
 */
export default class StaffStatisticsVisitorsHelper {
  /**
   * Renders the tab body for the current load state.
   *
   * @param {object} state - Load state.
   * @param {object|null} state.data - Mapped data (see `VisitorsController.map`).
   * @param {boolean} state.loading - Whether the visitors are loading.
   * @param {string|null} state.error - Error message, if loading failed.
   * @returns {React.ReactElement} The loading message, the error alert or the charts.
   */
  static renderState({ data, loading, error }) {
    if (loading) return <LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />;
    if (error) return <ErrorAlert error={error} />;

    return StaffStatisticsVisitorsHelper.render(data);
  }

  /**
   * Renders the loaded Visitors tab: title, totals tiles, notes, empty note and both charts.
   *
   * @description The tiles show the range totals (unique, new, returning and the visible
   *   audience series); the notes explain why the totals are not sums of the bars and what
   *   "new" means. The empty note is shown when the range has no visitors; both charts are
   *   drawn anyway.
   * @param {object} data - Mapped data (see `VisitorsController.map`).
   * @returns {React.ReactElement} The rendered tab content.
   */
  static render(data) {
    return (
      <section className="mt-3" data-testid="statistics-visitors">
        <h2 className="h5">{t('title')}</h2>
        {StaffStatisticsVisitorsHelper.#renderTiles(data)}
        <p className="text-muted small mb-1" data-testid="statistics-visitors-totals-note">{t('totals_note')}</p>
        <p className="text-muted small" data-testid="statistics-visitors-first-visit-note">{t('first_visit_note')}</p>
        {StaffStatisticsVisitorsHelper.#renderEmpty(data)}
        <h3 className="h6">{t('new_returning_title')}</h3>
        <StaffStatisticsCharts chart="VisitorsNewReturningChart" points={data.points} />
        <h3 className="h6">{t('audience_title')}</h3>
        <StaffStatisticsCharts chart="VisitorsAudienceChart" points={data.points} series={data.audienceSeries} />
      </section>
    );
  }

  static #renderTiles({ totals, audienceSeries }) {
    return (
      <div className="row">
        {StaffStatisticsVisitorsHelper.#renderTile('unique_visitors', totals.unique_visitors)}
        {StaffStatisticsVisitorsHelper.#renderTile('new', totals.new_visitors)}
        {StaffStatisticsVisitorsHelper.#renderTile(
          'returning', totals.returning_visitors, StaffStatisticsVisitorsHelper.#renderReturningShare(totals),
        )}
        {audienceSeries.map((key) => StaffStatisticsVisitorsHelper.#renderTile(key, totals[key]))}
      </div>
    );
  }

  static #renderTile(key, value, children = null) {
    return (
      <StatisticsKpiTile key={key} label={t(key)} value={count(value)} testId={`statistics-visitors-${key}`}>
        {children}
      </StatisticsKpiTile>
    );
  }

  static #renderReturningShare({ unique_visitors: uniqueVisitors, returning_visitors: returning }) {
    if (uniqueVisitors === 0) return null;

    return (
      <p className="mb-0" data-testid="statistics-visitors-returning-share">
        {`${t('returning_share')}: ${StatisticsBucketFormatter.percent(returning / uniqueVisitors)}`}
      </p>
    );
  }

  static #renderEmpty({ empty }) {
    if (!empty) return null;

    return <p className="text-muted" data-testid="statistics-visitors-empty">{t('empty')}</p>;
  }
}
