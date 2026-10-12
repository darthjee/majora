import Translator from '../../../../../../i18n/Translator.js';
import StaffPhotoThumbnail from '../../../../staff_photo/pages/elements/StaffPhotoThumbnail.jsx';
import StaffCopyHiddenBadge from '../StaffCopyHiddenBadge.jsx';

/**
 * Row cells of the Documents tab of the staff copy source list (issue #1577).
 *
 * @description Renders only its own cells — cover thumbnail (placeholder when the document has
 *   no ready cover), name, contents counts (pages, ready photos and ready files) and hidden
 *   badge; the selection checkbox and status cells are rendered by `StaffCopySourceRow`.
 *   Registered for the `documents` slug in `StaffCopyRows`.
 * @param {object} props - Component props.
 * @param {{id: number, name: string, hidden: boolean, photo: (string|null), pages_count: number,
 *   photos_count: number, files_count: number}} props.row - The source document row.
 * @returns {React.ReactElement} The document cells.
 */
export default function StaffCopyDocumentRow({ row }) {
  const counts = Translator.t('staff_copies_page.document_counts', {
    pages: row.pages_count,
    photos: row.photos_count,
    files: row.files_count,
  });

  return (
    <>
      <td><StaffPhotoThumbnail photo={{ id: row.id, path: row.photo }} /></td>
      <td>{row.name}</td>
      <td>{counts}</td>
      <td><StaffCopyHiddenBadge hidden={row.hidden} /></td>
    </>
  );
}
