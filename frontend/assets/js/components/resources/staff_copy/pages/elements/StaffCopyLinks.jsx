import Translator from '../../../../../i18n/Translator.js';
import StaffCopyLinkRow from './StaffCopyLinkRow.jsx';

const PREFIX = 'staff_copies_page';
const COLUMNS = ['links_entity_column', 'links_kind_column', 'links_status_column', 'links_error_column'];

/**
 * Builds the body of the links list: the empty message or the links table.
 *
 * @param {object[]} links - Link rows.
 * @param {object} props - The `StaffCopyLinks` props.
 * @param {number[]} props.retrying - Upload ids being retried.
 * @param {object} props.linkErrors - Upload id to local error i18n key.
 * @param {Function} props.onRetry - Called with a link when its Retry is clicked.
 * @returns {React.ReactElement} Empty message or table.
 */
function renderBody(links, { retrying, linkErrors, onRetry }) {
  if (links.length === 0) return <p className="text-muted">{Translator.t(`${PREFIX}.links_empty`)}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          {COLUMNS.map((key) => <th key={key}>{Translator.t(`${PREFIX}.${key}`)}</th>)}
          <th />
        </tr>
      </thead>
      <tbody>
        {links.map((link) => (
          <StaffCopyLinkRow
            key={link.upload_id}
            link={link}
            retrying={retrying.includes(link.upload_id)}
            localError={linkErrors[link.upload_id] ?? null}
            onRetry={onRetry}
          />
        ))}
      </tbody>
    </table>
  );
}

/**
 * Pending / failed links list of the staff copy page (issue #1571).
 *
 * @description Independent of the active tab: shown whenever a target game is selected
 *   (including the empty-types state), hidden otherwise or until the list has loaded.
 * @param {object} props - Component props.
 * @param {string} props.target - Selected target game slug (`''` when none).
 * @param {object[]|null} props.links - Link rows, or `null` until loaded.
 * @param {number[]} props.retrying - Upload ids being retried.
 * @param {Object<number, string|null>} props.linkErrors - Upload id to local error i18n key.
 * @param {Function} props.onRetry - Called with a link when its Retry is clicked.
 * @returns {React.ReactElement|null} Links section, or `null`.
 */
export default function StaffCopyLinks(props) {
  const { target, links } = props;

  if (!target || !links) return null;

  return (
    <section className="mt-4">
      <h2 className="h4">{Translator.t(`${PREFIX}.links_title`)}</h2>
      {renderBody(links, props)}
    </section>
  );
}
