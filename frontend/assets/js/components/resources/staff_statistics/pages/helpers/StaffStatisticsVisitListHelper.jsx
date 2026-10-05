import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import Translator from '../../../../../i18n/Translator.js';
import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import StatisticsVisitListTable from '../elements/StatisticsVisitListTable.jsx';
import StatisticsTabs from './StatisticsTabs.js';
import { sortHref } from './visitListSort.js';

const t = (key) => Translator.t(`staff_statistics_page.visit_list.${key}`);

/**
 * Rendering helper of the Visit list tab body (issue #1523).
 */
export default class StaffStatisticsVisitListHelper {
  /**
   * Renders the tab body for the current load state.
   *
   * @param {object} state - Load state.
   * @param {object|null} state.data - Mapped data (see `VisitListController.map`).
   * @param {boolean} state.loading - whether the visits are loading.
   * @param {string|null} state.error - Error message, if loading failed.
   * @param {object} filters - Current statistics filters, carried into the links.
   * @returns {React.ReactElement} The loading message, the error alert or the visit list content.
   */
  static renderState({ data, loading, error }, filters) {
    if (loading) return <LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />;
    if (error) return <ErrorAlert error={error} />;

    return StaffStatisticsVisitListHelper.render(data, filters);
  }

  /**
   * Renders the loaded Visit list tab: title, visit table (or empty note) and pagination.
   *
   * @description Without rows, the empty note replaces the table; the pagination is still
   *   shown past page 1 (counting the current page even when it is past the last one), so
   *   the user can go back.
   * @param {object} data - Mapped data (see `VisitListController.map`).
   * @param {object} filters - Current statistics filters, carried into the links.
   * @returns {React.ReactElement} The rendered tab content.
   */
  static render(data, filters) {
    return (
      <section className="mt-3" data-testid="statistics-visit-list">
        <h2 className="h5">{t('title')}</h2>
        {StaffStatisticsVisitListHelper.#renderContent(data, filters)}
        {StaffStatisticsVisitListHelper.#renderPagination(data, filters)}
      </section>
    );
  }

  /**
   * Builds the query params kept on every pagination link.
   *
   * @description The filters not at their default (as `statisticsHref` writes them) plus
   *   `sort` when it is not the default.
   * @param {object} filters - Current statistics filters.
   * @param {string} sort - The current sort key.
   * @returns {URLSearchParams} The extra pagination params.
   */
  static paginationParams(filters, sort) {
    return HashQueryParams.parse(sortHref(filters, sort));
  }

  static #renderContent({ rows, sort, empty }, filters) {
    if (empty) return <p className="text-muted" data-testid="statistics-visit-list-empty">{t('empty')}</p>;

    return <StatisticsVisitListTable rows={rows} sort={sort} filters={filters} />;
  }

  static #renderPagination({
    page, pages, perPage, sort, empty,
  }, filters) {
    if (empty && page <= 1) return null;

    return (
      <Pagination
        currentPage={page}
        totalPages={Math.max(pages, page)}
        perPage={perPage}
        basePath={StatisticsTabs.hashPath('visit_list')}
        extraParams={StaffStatisticsVisitListHelper.paginationParams(filters, sort)}
      />
    );
  }
}
