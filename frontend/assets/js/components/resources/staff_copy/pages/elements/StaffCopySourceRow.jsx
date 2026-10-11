import StaffCopyRows from '../helpers/StaffCopyRows.js';
import StaffCopyRowStatus from './StaffCopyRowStatus.jsx';

/**
 * One row of the staff copy source list.
 *
 * @description Renders the shared selection checkbox cell, then the cells of the row component
 *   registered for the copy type (see `StaffCopyRows`), then the shared status cell.
 * @param {object} props - Component props.
 * @param {string} props.slug - Active copy type slug.
 * @param {object} props.row - The source row.
 * @param {boolean} props.selected - Whether the row is selected.
 * @param {boolean} props.disabled - Whether the checkbox is disabled (copy run in progress).
 * @param {Function} props.onToggle - Called with the row when toggled.
 * @returns {React.ReactElement} Table row.
 */
export default function StaffCopySourceRow({
  slug, row, selected, disabled, onToggle,
}) {
  const RowComponent = StaffCopyRows.rowFor(slug);

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          className="form-check-input"
          aria-label={row.name}
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(row)}
        />
      </td>
      <RowComponent row={row} selected={selected} onToggle={onToggle} />
      <td><StaffCopyRowStatus row={row} /></td>
    </tr>
  );
}
