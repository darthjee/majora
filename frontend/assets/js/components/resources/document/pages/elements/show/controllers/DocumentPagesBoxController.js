import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import HashQueryParams from '../../../../../../../utils/routing/HashQueryParams.js';
import getCurrentHash from '../../../../../../../utils/routing/currentHash.js';
import parsePositiveInt from '../../../../../../../utils/parsePositiveInt.js';

const DEFAULT_PER_PAGE = 1;
const WINDOW_PER_PAGE = 4;

/**
 * Manages the DocumentPagesBox element's paging/window/segment bookkeeping (issue #1126): fetches
 * a `GameDocument`'s own `GameDocumentPage`s one at a time through `RequestStore`
 * (`gameDocumentPage.collection`), tracking which pages are already loaded so scrolling never
 * re-fetches a page it already appended. Kept as a set of pure, state-in/state-out methods
 * (mirroring how `DescriptionBox` keeps its own state in React, not the controller) so the
 * scroll-triggered append logic — which has no existing precedent in this codebase — is
 * unit-testable without a real DOM scroll or a real `IntersectionObserver`.
 *
 * @description State shape returned/consumed by every method here: `{segments, loadedPages,
 *   totalPages, currentPage}` — `segments` is the ordered (by `order` ascending) list of loaded
 *   `GameDocumentPage`s, `loadedPages` is a `Set` of their own `order` values (doubling as the
 *   "page number" the `Pagination` component paginates over, since the steady-state fetch is
 *   always `per_page=1`), `totalPages` mirrors the last fetch's own pagination metadata, and
 *   `currentPage` is the pagination indicator (updated by the segment-visibility observer without
 *   a fetch, and by `loadInitial()`/`loadNext()` on an actual fetch).
 *
 *   There is deliberately no separate "explicit pagination-link click" method distinct from
 *   `loadInitial()`: `AppHelper.render` keys the whole routed page tree off the full hash string
 *   (hash + language + load version), so every hash change — including a `Pagination` link that
 *   only changes `?page=` — already remounts `DocumentPagesBox` from scratch (mirroring how
 *   `FactionCharactersPanel`'s own pagination works, with no dedicated click handler either).
 *   `loadInitial()` re-reading the hash on each fresh mount is exactly the "reset to a fresh
 *   page, don't append" behavior a page-link click needs.
 */
export default class DocumentPagesBoxController {
  /**
   * Create a DocumentPagesBoxController.
   *
   * @param {string} gameSlug - Game slug the document belongs to.
   * @param {number|string} id - `GameDocument` id.
   */
  constructor(gameSlug, id) {
    this.gameSlug = gameSlug;
    this.id = id;
  }

  /**
   * Build the initial state: reads `page` from the current hash (defaulting to `1`), fetching
   * either a single page (default entry) or a small `per_page=4` window centered just before the
   * requested page (deep link, e.g. `?page=5`) so scrolling back up immediately has the previous
   * page already loaded. Degrades to an empty state on fetch failure, so a broken page reader
   * never blocks the rest of the document show page.
   *
   * @returns {Promise<{segments: object[], loadedPages: Set<number>, totalPages: number,
   *   currentPage: number}>} Resolves to the box's initial state.
   */
  loadInitial() {
    const query = HashQueryParams.parse(getCurrentHash());
    const requestedPage = parsePositiveInt(query.get('page'), 1);

    if (requestedPage <= 1) {
      return this.#fetch(1, DEFAULT_PER_PAGE)
        .then((result) => DocumentPagesBoxController.#toState(result, 1))
        .catch(() => DocumentPagesBoxController.#emptyState());
    }

    const windowStart = Math.max(1, requestedPage - 1);

    return this.#fetch(windowStart, WINDOW_PER_PAGE)
      .then((result) => DocumentPagesBoxController.#toState(result, requestedPage))
      .catch(() => DocumentPagesBoxController.#emptyState());
  }

  /**
   * Fetch and append the next not-yet-loaded page, called when the bottom sentinel scrolls into
   * view. A no-op (resolves the same state back) when the last loaded page is already the
   * document's final page, so repeated scroll-to-bottom intersections don't keep re-fetching, or
   * when the fetch itself fails — a transient "load more" failure must not blank out pages
   * already loaded and shown, unlike `loadInitial()`'s own degrade-to-empty.
   *
   * @param {{segments: object[], loadedPages: Set<number>, totalPages: number, currentPage:
   *   number}} state - Current box state.
   * @returns {Promise<{segments: object[], loadedPages: Set<number>, totalPages: number,
   *   currentPage: number}>} Resolves to the state with the next page appended, or the same state
   *   unchanged when there is nothing left to load or the fetch failed.
   */
  loadNext(state) {
    const maxLoadedPage = DocumentPagesBoxController.#maxLoadedPage(state.loadedPages);

    if (maxLoadedPage >= state.totalPages) {
      return Promise.resolve(state);
    }

    return this.#fetch(maxLoadedPage + 1, DEFAULT_PER_PAGE)
      .then((result) => DocumentPagesBoxController.#appendState(state, result))
      .catch(() => state);
  }

  /**
   * Resolve which loaded page number should become the pagination indicator, from a set of
   * `IntersectionObserver` entries observing each rendered segment — the segment with the
   * greatest intersection ratio among the currently-intersecting ones wins. Never fetches: this
   * is what lets scrolling back up to an already-loaded page update the indicator without
   * re-requesting it. Pure and DOM-independent (entries are plain `{isIntersecting,
   * intersectionRatio, target: {dataset: {page}}}`-shaped objects), so it's testable without a
   * real `IntersectionObserver`.
   *
   * @param {Array<{isIntersecting: boolean, intersectionRatio: number, target: {dataset:
   *   {page?: string}}}>} entries - `IntersectionObserver` callback entries.
   * @param {number} fallbackPage - Page number to return when no entry is currently intersecting.
   * @returns {number} The most-visible loaded page number, or `fallbackPage`.
   */
  static resolveMostVisiblePage(entries, fallbackPage) {
    const visible = entries.filter((entry) => entry.isIntersecting);

    if (visible.length === 0) {
      return fallbackPage;
    }

    const best = visible.reduce((top, entry) => (
      entry.intersectionRatio > top.intersectionRatio ? entry : top
    ));

    return parsePositiveInt(best.target?.dataset?.page, fallbackPage);
  }

  #fetch(page, perPage) {
    return RequestStore.ensure({
      componentName: 'DocumentPagesBoxController',
      resource: 'gameDocumentPage',
      quantityType: 'collection',
      params: { gameSlug: this.gameSlug, id: this.id },
      query: { page, per_page: perPage },
    })
      .then(({ data, pagination }) => ({
        segments: Array.isArray(data) ? data : [],
        totalPages: pagination?.pages ?? 1,
      }));
  }

  static #toState({ segments, totalPages }, targetPage) {
    const sorted = DocumentPagesBoxController.#sortSegments(segments);
    const loadedPages = new Set(sorted.map((segment) => segment.order));
    const currentPage = loadedPages.has(targetPage) ? targetPage : (sorted[0]?.order ?? targetPage);

    return {
      segments: sorted, loadedPages, totalPages, currentPage,
    };
  }

  static #appendState(state, { segments, totalPages }) {
    const merged = DocumentPagesBoxController.#sortSegments([...state.segments, ...segments]);
    const loadedPages = new Set(state.loadedPages);

    segments.forEach((segment) => loadedPages.add(segment.order));

    return {
      segments: merged, loadedPages, totalPages, currentPage: state.currentPage,
    };
  }

  static #sortSegments(segments) {
    return [...segments].sort((a, b) => a.order - b.order);
  }

  static #maxLoadedPage(loadedPages) {
    return [...loadedPages].reduce((max, page) => Math.max(max, page), 0);
  }

  static #emptyState() {
    return {
      segments: [], loadedPages: new Set(), totalPages: 0, currentPage: 1,
    };
  }
}
