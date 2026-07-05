import TableHelper from './helpers/TableHelper.jsx';

/**
 * Generic table element, rendering a set of columns and rows plus an
 * optional per-row actions cell. Not coupled to any particular row shape,
 * so it can be reused across different pages.
 *
 * @param {object} props - Component props.
 * @param {{key: string, label: string}[]} props.columns - Column definitions.
 * @param {object[]} props.rows - Row data objects, keyed by `column.key`.
 * @param {Function} [props.renderActions] - Optional per-row actions renderer,
 *   called with a row and returning a React node rendered in a trailing cell.
 * @returns {React.ReactElement} Table element.
 */
export default function Table({ columns, rows, renderActions }) {
  return TableHelper.render(columns, rows, renderActions);
}
