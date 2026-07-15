/**
 * Column definitions for the game sessions index page, which fetches and
 * paginates the past/future/unscheduled endpoints independently. Each column
 * carries its own hash query param names so paginating one column doesn't
 * clobber the others' state.
 *
 * @type {{key: string, pageParam: string, perPageParam: string}[]}
 */
export const SESSION_COLUMNS = [
  { key: 'past', pageParam: 'past_page', perPageParam: 'past_per_page' },
  { key: 'future', pageParam: 'future_page', perPageParam: 'future_per_page' },
  { key: 'unscheduled', pageParam: 'unscheduled_page', perPageParam: 'unscheduled_per_page' },
];

/**
 * Default pagination metadata used for a column before its first fetch resolves.
 *
 * @type {{page: number, pages: number, perPage: number}}
 */
export const DEFAULT_SESSION_PAGINATION = { page: 1, pages: 1, perPage: 10 };

/**
 * Builds the default 3-column state (empty sessions, default pagination) used
 * to initialize the game sessions index page before any fetch resolves.
 *
 * @returns {object} Map of column key to `{sessions, pagination}` state.
 */
export function buildDefaultSessionColumns() {
  return SESSION_COLUMNS.reduce((columns, { key }) => ({
    ...columns,
    [key]: { sessions: [], pagination: DEFAULT_SESSION_PAGINATION },
  }), {});
}
