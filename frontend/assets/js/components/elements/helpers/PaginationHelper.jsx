import React from 'react';
import PaginationController from '../controllers/PaginationController.js';
import PageLink from '../PageLink.jsx';

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
   * @returns {React.ReactElement|null} Pagination nav or null.
   */
  static render(currentPage, totalPages, perPage, basePath) {
    const pages = this.#normalizePositiveInteger(totalPages, 1);

    if (pages <= 1) {
      return null;
    }

    const page = this.#clamp(this.#normalizePositiveInteger(currentPage, 1), 1, pages);
    const itemsPerPage = this.#normalizePositiveInteger(perPage, 10);
    const pageList = new PaginationController(page, pages).buildPageList();
    const linkTemplate = `${basePath}?page=:page&per_page=:perPage`;

    return (
      <nav aria-label="Games pages" className="mt-4">
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
   * Parse a positive integer, returning a fallback for invalid values.
   *
   * @param {number|string} value - Value to parse.
   * @param {number} fallback - Fallback for invalid values.
   * @returns {number} Positive integer.
   */
  static #normalizePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
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
        <PageLink urlTemplate={linkTemplate} page={currentPage - 1} perPage={perPage} ariaLabel="Previous">
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
        <PageLink urlTemplate={linkTemplate} page={currentPage + 1} perPage={perPage} ariaLabel="Next">
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
