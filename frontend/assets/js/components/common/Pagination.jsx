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
 * @returns {React.ReactElement|null} Pagination nav or null.
 */
export default function Pagination({ currentPage, totalPages, perPage, basePath, extraParams = {} }) {
  return PaginationHelper.render(currentPage, totalPages, perPage, basePath, extraParams);
}
