import StaffPhotoThumbnail from '../../../../staff_photo/pages/elements/StaffPhotoThumbnail.jsx';
import StaffCopyHiddenBadge from '../StaffCopyHiddenBadge.jsx';

/**
 * Row cells of the Possessions tab of the staff copy source list (issue #1575).
 *
 * @description Renders only its own cells — cover thumbnail (placeholder when the possession has no
 *   ready cover), name and hidden badge; the selection checkbox and status cells are rendered by
 *   `StaffCopySourceRow`. Registered for the `possessions` slug in `StaffCopyRows`.
 * @param {object} props - Component props.
 * @param {{id: number, name: string, hidden: boolean, photo: (string|null)}} props.row - The
 *   source possession row.
 * @returns {React.ReactElement} The possession cells.
 */
export default function StaffCopyPossessionRow({ row }) {
  return (
    <>
      <td><StaffPhotoThumbnail photo={{ id: row.id, path: row.photo }} /></td>
      <td>{row.name}</td>
      <td><StaffCopyHiddenBadge hidden={row.hidden} /></td>
    </>
  );
}
