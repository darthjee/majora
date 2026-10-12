import StaffPhotoThumbnail from '../../../../staff_photo/pages/elements/StaffPhotoThumbnail.jsx';
import StaffCopyHiddenBadge from '../StaffCopyHiddenBadge.jsx';

/**
 * Row cells of the Items tab of the staff copy source list (issue #1572).
 *
 * @description Renders only its own cells — cover thumbnail (placeholder when the item has no
 *   ready cover), name and hidden badge; the selection checkbox and status cells are rendered by
 *   `StaffCopySourceRow`. Registered for the `items` slug in `StaffCopyRows`.
 * @param {object} props - Component props.
 * @param {{id: number, name: string, hidden: boolean, photo: (string|null)}} props.row - The
 *   source item row.
 * @returns {React.ReactElement} The item cells.
 */
export default function StaffCopyItemRow({ row }) {
  return (
    <>
      <td><StaffPhotoThumbnail photo={{ id: row.id, path: row.photo }} /></td>
      <td>{row.name}</td>
      <td><StaffCopyHiddenBadge hidden={row.hidden} /></td>
    </>
  );
}
