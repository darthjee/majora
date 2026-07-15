import PaginationHelper from './helpers/PaginationHelper.jsx';

/**
 * Pagination navigation component for paged content.
 *
 * @param {object} props - Component props.
 * @param {number} props.currentPage - Currently active page.
 * @param {number} props.totalPages - Total number of pages.
 * @param {number} props.perPage - Items per page.
 * @param {string} props.basePath - Base hash path for page links.
 * @param {object|URLSearchParams} [props.extraParams] - Additional active query params (e.g.
 *   NPC filters) preserved on every pagination link.
 * @param {string} [props.pageParam] - Query param name used for the page number, so multiple
 *   independent paginations can share a page/route without clobbering each other's state.
 *   Defaults to `'page'`, so other callers are unaffected.
 * @param {string} [props.perPageParam] - Query param name used for the per-page count, mirroring
 *   `pageParam`. Defaults to `'per_page'`, so other callers are unaffected.
 * @returns {React.ReactElement|null} Pagination nav or null.
 */
export default function Pagination({
  currentPage, totalPages, perPage, basePath, extraParams = {}, pageParam = 'page', perPageParam = 'per_page',
}) {
  return PaginationHelper.render(
    currentPage, totalPages, perPage, basePath, extraParams, pageParam, perPageParam,
  );
}
