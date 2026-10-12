import Badge from '../../../../common/badges/Badge.jsx';
import Translator from '../../../../../i18n/Translator.js';

const PREFIX = 'staff_copies_page';

const VARIANTS = {
  pending: 'secondary', linking: 'info', linked: 'success', failed: 'danger',
};

/**
 * Per-file link status of a copied entry in the staff copy progress (issue #1571).
 *
 * @param {object} props - Component props.
 * @param {{upload_type: string, status: string}} props.link - The link and its run status
 *   (`pending`, `linking`, `linked` or `failed`).
 * @returns {React.ReactElement} Kind label and status badge.
 */
export default function StaffCopyLinkResult({ link }) {
  return (
    <li className="d-flex gap-2 align-items-center">
      <span>{Translator.t(`${PREFIX}.link_kind.${link.upload_type}`, link.upload_type)}</span>
      <Badge variant={VARIANTS[link.status]} text={Translator.t(`${PREFIX}.link_status.${link.status}`)} />
    </li>
  );
}
