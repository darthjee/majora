import Translator from '../../../../../i18n/Translator.js';
import { staffCopyLinkErrorKey } from '../helpers/StaffCopyErrors.js';

const PREFIX = 'staff_copies_page';

/**
 * Builds the error text of a link row.
 *
 * @param {{status: string, error: (string|null)}} link - The link row.
 * @param {string|null} localError - i18n key of a local retry error (e.g. renew `409`).
 * @returns {string} Translated error, or `''` when there is none.
 */
export function linkErrorText(link, localError) {
  if (localError) return Translator.t(localError);
  if (link.status !== 'failed') return '';

  return Translator.t(staffCopyLinkErrorKey(link.error));
}

/**
 * Builds the copied entry label of a link row: its name plus its type label when known.
 *
 * @param {{name: string, type?: string}} entity - The copied entry.
 * @returns {string} Entry label, e.g. `Sword (Items)`.
 */
export function linkEntityLabel({ name, type }) {
  const typeLabel = type ? Translator.t(`${PREFIX}.types.${type}`, '') : '';

  return typeLabel ? `${name} (${typeLabel})` : name;
}

/**
 * One row of the staff copy pending / failed links list (issue #1571).
 *
 * @param {object} props - Component props.
 * @param {{upload_id: number, upload_type: string, status: string, error: (string|null),
 *   entity: {name: string, type?: string}}} props.link - The link row.
 * @param {boolean} props.retrying - Whether this row is being retried.
 * @param {string|null} props.localError - i18n key of a local retry error.
 * @param {Function} props.onRetry - Called with the link when Retry is clicked.
 * @returns {React.ReactElement} Table row.
 */
export default function StaffCopyLinkRow({
  link, retrying, localError, onRetry,
}) {
  const status = retrying ? 'linking' : link.status;

  return (
    <tr>
      <td>{linkEntityLabel(link.entity ?? { name: '' })}</td>
      <td>{Translator.t(`${PREFIX}.link_kind.${link.upload_type}`, link.upload_type)}</td>
      <td>{Translator.t(`${PREFIX}.link_status.${status}`, status)}</td>
      <td className="text-danger">{linkErrorText(link, localError)}</td>
      <td>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          disabled={retrying}
          onClick={() => onRetry(link)}
        >
          {Translator.t(`${PREFIX}.retry`)}
        </button>
      </td>
    </tr>
  );
}
