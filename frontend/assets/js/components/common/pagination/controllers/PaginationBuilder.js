/**
 * Builds a sparse page list for pagination, inserting `null` entries for gaps.
 */
export default class PaginationBuilder {
  /**
   * Create a PaginationBuilder.
   *
   * @param {number} currentPage - Currently selected page.
   * @param {number} totalPages - Total number of available pages.
   */
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.pages = new Set();
  }

  /**
   * Add the first pages that should always be visible.
   *
   * @returns {PaginationBuilder} This instance.
   */
  addFirstPages() {
    return this.#addRange(1, 3);
  }

  /**
   * Add the last pages that should always be visible.
   *
   * @returns {PaginationBuilder} This instance.
   */
  addLastPages() {
    return this.#addRange(this.totalPages - 2, this.totalPages);
  }

  /**
   * Add the sliding window of pages around the current page.
   *
   * @returns {PaginationBuilder} This instance.
   */
  addCurrentPageWindow() {
    return this.#addRange(this.currentPage - 3, this.currentPage + 3);
  }

  /**
   * Return the sorted page list with `null` gap markers between non-consecutive pages.
   *
   * @returns {Array<number|null>} Page list with gap markers.
   */
  build() {
    const sortedPages = [...this.pages].sort((a, b) => a - b);
    return this.#withGaps(sortedPages);
  }

  /**
   * Add an inclusive page range to the internal set, clamped to valid bounds.
   *
   * @param {number} start - First page in range.
   * @param {number} finish - Last page in range.
   * @returns {PaginationBuilder} This instance.
   */
  #addRange(start, finish) {
    for (let page = start; page <= finish; page += 1) {
      if (page >= 1 && page <= this.totalPages) {
        this.pages.add(page);
      }
    }
    return this;
  }

  /**
   * Insert `null` markers between non-consecutive pages.
   *
   * @param {number[]} sortedPages - Sorted page list without gaps.
   * @returns {Array<number|null>} Page list with gap markers.
   */
  #withGaps(sortedPages) {
    if (sortedPages.length === 0) {
      return [];
    }

    const list = [sortedPages[0]];

    for (let i = 1; i < sortedPages.length; i += 1) {
      if (sortedPages[i] - sortedPages[i - 1] > 1) {
        list.push(null);
      }
      list.push(sortedPages[i]);
    }

    return list;
  }
}
