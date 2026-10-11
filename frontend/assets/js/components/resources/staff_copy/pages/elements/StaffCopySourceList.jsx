import Pagination from '../../../../common/pagination/Pagination.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffCopyRows from '../helpers/StaffCopyRows.js';
import { allSelected } from '../hooks/useStaffCopySelection.js';
import StaffCopySourceRow from './StaffCopySourceRow.jsx';

const PREFIX = 'staff_copies_page';

/**
 * Paginated source list of the staff copy page.
 *
 * @description Renders the copy button (disabled when nothing is selected or a run is in
 *   progress), a table whose header holds the select-all-on-this-page checkbox plus the column
 *   headers of the copy type's registered row (see `StaffCopyRows`), one row per source entry,
 *   and the pagination. Renders the empty message when there are no rows.
 * @param {object} props - Component props.
 * @param {{type: string, from: string, to: string}} props.selection - Current selection.
 * @param {object[]} props.rows - Source rows of the current page.
 * @param {{page: number, pages: number, perPage: number}} props.pagination - Pagination.
 * @param {number[]} props.selectedIds - Selected row ids.
 * @param {boolean} props.running - Whether a copy run is in progress.
 * @param {{onToggle: Function, onToggleAll: Function, onCopy: Function}} props.handlers -
 *   Selection toggles and the copy action.
 * @returns {React.ReactElement} Source list.
 */
export default function StaffCopySourceList({
  selection, rows, pagination, selectedIds, running, handlers,
}) {
  if (rows.length === 0) return <p className="text-muted">{Translator.t(`${PREFIX}.empty`)}</p>;

  return (
    <>
      <div className="my-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={selectedIds.length === 0 || running}
          onClick={handlers.onCopy}
        >
          {Translator.t(`${PREFIX}.copy`)}
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                className="form-check-input"
                aria-label={Translator.t(`${PREFIX}.select_all`)}
                checked={allSelected(selectedIds, rows)}
                disabled={running}
                onChange={handlers.onToggleAll}
              />
            </th>
            {StaffCopyRows.columnsFor(selection.type).map((label) => <th key={label}>{label}</th>)}
            <th>{Translator.t(`${PREFIX}.status_column`)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StaffCopySourceRow
              key={row.id}
              slug={selection.type}
              row={row}
              selected={selectedIds.includes(row.id)}
              disabled={running}
              onToggle={handlers.onToggle}
            />
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        perPage={pagination.perPage}
        basePath="#/staff/copies"
        extraParams={selection}
      />
    </>
  );
}
