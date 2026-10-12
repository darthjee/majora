import StaffPhotoThumbnail from '../../../../staff_photo/pages/elements/StaffPhotoThumbnail.jsx';

/**
 * Row cells of the Factions tab of the staff copy source list (issue #1576).
 *
 * @description Renders only its own cells — cover thumbnail (placeholder when the faction has no
 *   ready cover) and name; factions have no hidden flag. The selection checkbox and status cells
 *   are rendered by `StaffCopySourceRow`. Registered for the `factions` slug in `StaffCopyRows`.
 * @param {object} props - Component props.
 * @param {{id: number, name: string, photo: (string|null)}} props.row - The source faction row.
 * @returns {React.ReactElement} The faction cells.
 */
export default function StaffCopyFactionRow({ row }) {
  return (
    <>
      <td><StaffPhotoThumbnail photo={{ id: row.id, path: row.photo }} /></td>
      <td>{row.name}</td>
    </>
  );
}
