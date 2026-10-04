import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffStatisticsCharts from '../elements/StaffStatisticsCharts.jsx';
import StatisticsBucketFormatter from './StatisticsBucketFormatter.js';

const t = (key) => Translator.t(`staff_statistics_page.visits.${key}`);

/**
 * Rendering helper of the Visits tab body (issue #1507).
 */
export default class StaffStatisticsVisitsHelper {
  /**
   * Renders the tab body for the current load state.
   *
   * @param {object} state - Load state.
   * @param {object|null} state.data - Mapped data (see `VisitsController.map`).
   * @param {boolean} state.loading - Whether the visits are loading.
   * @param {string|null} state.error - Error message, if loading failed.
   * @returns {React.ReactElement} The loading message, the error alert or the chart.
   */
  static renderState({ data, loading, error }) {
    if (loading) return <LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />;
    if (error) return <ErrorAlert error={error} />;

    return StaffStatisticsVisitsHelper.render(data);
  }

  /**
   * Renders the loaded Visits tab: title, totals line, empty note and stacked chart.
   *
   * @description The totals line shows the total, then the count of each visible series.
   *   The empty note is shown when the range has no visits; the chart is drawn anyway.
   * @param {object} data - Mapped data (see `VisitsController.map`).
   * @returns {React.ReactElement} The rendered tab content.
   */
  static render(data) {
    return (
      <section className="mt-3" data-testid="statistics-visits">
        <h2 className="h5">{t('title')}</h2>
        {StaffStatisticsVisitsHelper.#renderTotals(data)}
        {StaffStatisticsVisitsHelper.#renderEmpty(data)}
        <StaffStatisticsCharts chart="VisitsChart" points={data.points} series={data.series} />
      </section>
    );
  }

  static #renderTotals({ totals, series }) {
    const items = [['total', totals.visits], ...series.map((key) => [key, totals[key]])];

    return (
      <p className="mb-2" data-testid="statistics-visits-totals">
        {items.map(([key, value]) => (
          <span key={key} className="me-3">{`${t(key)}: ${StatisticsBucketFormatter.count(value)}`}</span>
        ))}
      </p>
    );
  }

  static #renderEmpty({ empty }) {
    if (!empty) return null;

    return <p className="text-muted" data-testid="statistics-visits-empty">{t('empty')}</p>;
  }
}
