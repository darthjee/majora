import PaginationBuilder from './PaginationBuilder.js';

/**
 * Builds the page list used by the pagination view.
 */
export default class PaginationController {
  /**
   * Create a PaginationController.
   *
   * @param {number} currentPage - Currently selected page.
   * @param {number} totalPages - Total number of available pages.
   */
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
  }

  /**
   * Return the page list with gap markers.
   *
   * @returns {Array<number|null>} Page list for pagination rendering.
   */
  buildPageList() {
    if (this.totalPages <= 0) {
      return [];
    }

    return new PaginationBuilder(this.currentPage, this.totalPages)
      .addFirstPages()
      .addLastPages()
      .addCurrentPageWindow()
      .build();
  }
}
