import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffStatisticsCharts from '../elements/StaffStatisticsCharts.jsx';
import StatisticsDomainsTable from '../elements/StatisticsDomainsTable.jsx';
import StatisticsKpiTile from '../elements/StatisticsKpiTile.jsx';
import StatisticsBucketFormatter from './StatisticsBucketFormatter.js';
import StatisticsDurationFormatter from './StatisticsDurationFormatter.js';

const t = (key) => Translator.t(`staff_statistics_page.domains.${key}`);
const count = (value) => StatisticsBucketFormatter.count(value);
const duration = (value) => StatisticsDurationFormatter.format(value);

const TILES = [
  { key: 'visits', field: 'visits', format: count },
  {
    key: 'anonymous', field: 'anonymous', format: count, series: true,
  },
  {
    key: 'logged_in', field: 'logged_in', format: count, series: true,
  },
  { key: 'unique_visitors', field: 'unique_visitors', format: count },
  { key: 'average_duration', field: 'average_duration_seconds', format: duration },
  { key: 'median_duration', field: 'median_duration_seconds', format: duration },
];

/**
 * Rendering helper of the Domains tab body (issue #1517).
 */
export default class StaffStatisticsDomainsHelper {
  /**
   * Renders the tab body for the current load state.
   *
   * @param {object} state - Load state.
   * @param {object|null} state.data - Mapped data (see `DomainsController.map`).
   * @param {boolean} state.loading - Whether the domains are loading.
   * @param {string|null} state.error - Error message, if loading failed.
   * @param {object} filters - Current statistics filters, carried into the table row links.
   * @returns {React.ReactElement} The loading message, the error alert or the domains content.
   */
  static renderState({ data, loading, error }, filters) {
    if (loading) return <LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />;
    if (error) return <ErrorAlert error={error} />;

    return StaffStatisticsDomainsHelper.render(data, filters);
  }

  /**
   * Renders the loaded Domains tab: title, totals tiles, empty note, chart and table.
   *
   * @description The tiles show the range totals (visits, the anonymous / logged-in counts
   *   visible for the audience filter, unique visitors, average and median duration). The
   *   empty note is shown when the range has no visits; the chart and table are still drawn
   *   with the zero rows, unless there are no rows at all (e.g. an unknown domain id).
   * @param {object} data - Mapped data (see `DomainsController.map`).
   * @param {object} filters - Current statistics filters, carried into the table row links.
   * @returns {React.ReactElement} The rendered tab content.
   */
  static render(data, filters) {
    return (
      <section className="mt-3" data-testid="statistics-domains">
        <h2 className="h5">{t('title')}</h2>
        {StaffStatisticsDomainsHelper.#renderTiles(data)}
        {StaffStatisticsDomainsHelper.#renderEmpty(data)}
        {StaffStatisticsDomainsHelper.#renderRows(data, filters)}
      </section>
    );
  }

  static #renderTiles({ totals, series }) {
    const visible = TILES.filter((tile) => !tile.series || series.includes(tile.key));

    return (
      <div className="row">
        {visible.map(({ key, field, format }) => (
          <StatisticsKpiTile key={key} label={t(key)} value={format(totals[field])} testId={`statistics-domains-${key}`} />
        ))}
      </div>
    );
  }

  static #renderEmpty({ empty }) {
    if (!empty) return null;

    return <p className="text-muted" data-testid="statistics-domains-empty">{t('empty')}</p>;
  }

  static #renderRows({ domains, series, noRows }, filters) {
    if (noRows) return null;

    return (
      <>
        <h3 className="h6">{t('chart')}</h3>
        <StaffStatisticsCharts chart="DomainsChart" rows={domains} series={series} />
        <StatisticsDomainsTable rows={domains} series={series} filters={filters} />
      </>
    );
  }
}
