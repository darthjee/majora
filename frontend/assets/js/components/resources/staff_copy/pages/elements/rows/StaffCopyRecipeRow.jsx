import Translator from '../../../../../../i18n/Translator.js';
import Badge from '../../../../../common/badges/Badge.jsx';
import StaffCopyHiddenBadge from '../StaffCopyHiddenBadge.jsx';

/**
 * Row cells of the Recipes tab of the staff copy source list (issue #1574).
 *
 * @description Renders only its own cells — name, required common item name with a "reused"
 *   (the target game already holds a copy of that common item) or "will be copied" indicator,
 *   and hidden badge; the selection checkbox and status cells are rendered by
 *   `StaffCopySourceRow`. The indicator reflects the list as loaded. Registered for the
 *   `recipes` slug in `StaffCopyRows`.
 * @param {object} props - Component props.
 * @param {{id: number, name: string, hidden: boolean,
 *   common_item: {id: number, name: string, copied_to_target: boolean}}} props.row - The source
 *   recipe row.
 * @returns {React.ReactElement} The recipe cells.
 */
export default function StaffCopyRecipeRow({ row }) {
  const reused = Boolean(row.common_item.copied_to_target);
  const indicatorKey = reused ? 'common_item_reused' : 'common_item_will_copy';

  return (
    <>
      <td>{row.name}</td>
      <td>
        <span className="me-1">{row.common_item.name}</span>
        <Badge
          variant={reused ? 'info' : 'secondary'}
          text={Translator.t(`staff_copies_page.${indicatorKey}`)}
        />
      </td>
      <td><StaffCopyHiddenBadge hidden={row.hidden} /></td>
    </>
  );
}
