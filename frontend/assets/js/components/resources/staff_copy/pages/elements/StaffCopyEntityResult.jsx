import Badge from '../../../../common/badges/Badge.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffCopyLinkResult from './StaffCopyLinkResult.jsx';

const PREFIX = 'staff_copies_page';

const VARIANTS = {
  pending: 'secondary', copying: 'info', copied: 'success', failed: 'danger',
};

/**
 * Result line of one entry in the staff copy progress (issue #1571).
 *
 * @description Shows the entry name, its run status badge, the failure reason when it failed
 *   and the per-file link statuses once copied.
 * @param {object} props - Component props.
 * @param {{name: string, status: string, reason: (string|null), links: object[]}} props.entity -
 *   The run entity.
 * @returns {React.ReactElement} Result list item.
 */
export default function StaffCopyEntityResult({ entity }) {
  const reason = entity.reason ? Translator.t(entity.reason) : null;

  return (
    <li className="list-group-item">
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <strong>{entity.name}</strong>
        <Badge variant={VARIANTS[entity.status]} text={Translator.t(`${PREFIX}.entity_status.${entity.status}`)} />
        <ConditionalComponent render={Boolean(reason)}>
          <span className="text-danger">{reason}</span>
        </ConditionalComponent>
      </div>
      <ConditionalComponent render={entity.links.length > 0}>
        <ul className="list-unstyled ms-3 mb-0 mt-1">
          {entity.links.map((link) => <StaffCopyLinkResult key={link.upload_id} link={link} />)}
        </ul>
      </ConditionalComponent>
    </li>
  );
}
