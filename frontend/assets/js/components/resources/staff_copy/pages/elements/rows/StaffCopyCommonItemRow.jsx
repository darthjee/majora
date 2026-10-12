import Translator from '../../../../../../i18n/Translator.js';
import StaffPhotoThumbnail from '../../../../staff_photo/pages/elements/StaffPhotoThumbnail.jsx';
import StaffCopyHiddenBadge from '../StaffCopyHiddenBadge.jsx';

/**
 * Row cells of the Common items tab of the staff copy source list (issue #1573).
 *
 * @description Renders only its own cells — cover thumbnail (placeholder when the common item has
 *   no ready cover), name, translated category, price and hidden badge; the selection checkbox and
 *   status cells are rendered by `StaffCopySourceRow`. Registered for the `common_items` slug in
 *   `StaffCopyRows`.
 * @param {object} props - Component props.
 * @param {{id: number, name: string, category: string, price: number, hidden: boolean,
 *   photo: (string|null)}} props.row - The source common item row.
 * @returns {React.ReactElement} The common item cells.
 */
export default function StaffCopyCommonItemRow({ row }) {
  return (
    <>
      <td><StaffPhotoThumbnail photo={{ id: row.id, path: row.photo }} /></td>
      <td>{row.name}</td>
      <td>{Translator.t(`common_item_page.category.${row.category}`)}</td>
      <td>{row.price}</td>
      <td><StaffCopyHiddenBadge hidden={row.hidden} /></td>
    </>
  );
}
