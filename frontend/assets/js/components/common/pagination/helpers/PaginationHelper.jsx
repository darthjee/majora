import React from 'react';
import PaginationController from '../controllers/PaginationController.js';
import PageLink from '../PageLink.jsx';
import Translator from '../../../../i18n/Translator.js';
import parsePositiveInt from '../../../../utils/parsePositiveInt.js';

/**
 * Renders the Bootstrap pagination UI from raw pagination data.
 */
export default class PaginationHelper {
  /**
   * Render the pagination navigation, or null when only one page exists.
   *
   * @param {number|string} currentPage - Currently active page.
   * @param {number|string} totalPages - Total number of pages.
   * @param {number|string} perPage - Items per page.
   * @param {string} basePath - Base hash path (e.g. `#/games`).
   * @param {object|URLSearchParams} [extraParams] - Additional active query params (e.g. NPC
   *   filters) preserved on every pagination link. Defaults to none, so other callers of
   *   `PaginationHelper`/`Pagination` are unaffected.
   * @param {string} [pageParam] - Query param name used for the page number. Defaults to
   *   `'page'`, so other callers are unaffected.
   * @param {string} [perPageParam] - Query param name used for the per-page count. Defaults to
   *   `'per_page'`, so other callers are unaffected.
   * @returns {React.ReactElement|null} Pagination nav or null.
   */
  static render(
    currentPage, totalPages, perPage, basePath, extraParams = {}, pageParam = 'page', perPageParam = 'per_page',
  ) {
    const pages = parsePositiveInt(totalPages, 1);

    if (pages <= 1) {
      return null;
    }

    const page = this.#clamp(parsePositiveInt(currentPage, 1), 1, pages);
    const itemsPerPage = parsePositiveInt(perPage, 10);
    const pageList = new PaginationController(page, pages).buildPageList();
    const extraQuery = new URLSearchParams(extraParams).toString();
    const linkTemplate =
      `${basePath}?${pageParam}=:page&${perPageParam}=:perPage${extraQuery ? `&${extraQuery}` : ''}`;

    return (
      <nav aria-label={Translator.t('pagination.aria_label')} className="mt-4">
        <ul className="pagination justify-content-center">
          {this.#renderPreviousButton(page, itemsPerPage, linkTemplate)}
          {pageList.map((entry, index) =>
            this.#renderPageEntry(entry, index, page, itemsPerPage, linkTemplate)
          )}
          {this.#renderNextButton(page, pages, itemsPerPage, linkTemplate)}
        </ul>
      </nav>
    );
  }

  /**
   * Clamp a number between min and max.
   *
   * @param {number} value - Value to clamp.
   * @param {number} min - Minimum.
   * @param {number} max - Maximum.
   * @returns {number} Clamped value.
   */
  static #clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Render the previous-page button, disabled on the first page.
   *
   * @param {number} currentPage - Current page.
   * @param {number} perPage - Items per page.
   * @param {string} linkTemplate - URL template.
   * @returns {React.ReactElement} Previous button.
   */
  static #renderPreviousButton(currentPage, perPage, linkTemplate) {
    if (currentPage <= 1) {
      return (
        <li className="page-item disabled" aria-disabled="true">
          <span className="page-link" aria-hidden="true">«</span>
        </li>
      );
    }

    return (
      <li className="page-item">
        <PageLink
          urlTemplate={linkTemplate}
          page={currentPage - 1}
          perPage={perPage}
          ariaLabel={Translator.t('pagination.previous')}
        >
          <span aria-hidden="true">«</span>
        </PageLink>
      </li>
    );
  }

  /**
   * Render the next-page button, disabled on the last page.
   *
   * @param {number} currentPage - Current page.
   * @param {number} totalPages - Total pages.
   * @param {number} perPage - Items per page.
   * @param {string} linkTemplate - URL template.
   * @returns {React.ReactElement} Next button.
   */
  static #renderNextButton(currentPage, totalPages, perPage, linkTemplate) {
    if (currentPage >= totalPages) {
      return (
        <li className="page-item disabled" aria-disabled="true">
          <span className="page-link" aria-hidden="true">»</span>
        </li>
      );
    }

    return (
      <li className="page-item">
        <PageLink
          urlTemplate={linkTemplate}
          page={currentPage + 1}
          perPage={perPage}
          ariaLabel={Translator.t('pagination.next')}
        >
          <span aria-hidden="true">»</span>
        </PageLink>
      </li>
    );
  }

  /**
   * Render a numbered page item or an ellipsis gap marker.
   *
   * @param {number|null} entry - Page number or gap marker.
   * @param {number} index - List index.
   * @param {number} currentPage - Current page.
   * @param {number} perPage - Items per page.
   * @param {string} linkTemplate - URL template.
   * @returns {React.ReactElement} Page entry or gap entry.
   */
  static #renderPageEntry(entry, index, currentPage, perPage, linkTemplate) {
    if (entry === null) {
      return (
        <li key={`gap-${index}`} className="page-item disabled" aria-disabled="true">
          <span className="page-link">…</span>
        </li>
      );
    }

    const activeClass = entry === currentPage ? ' active' : '';

    return (
      <li key={`page-${entry}`} className={`page-item${activeClass}`}>
        <PageLink urlTemplate={linkTemplate} page={entry} perPage={perPage}>{entry}</PageLink>
      </li>
    );
  }
}
