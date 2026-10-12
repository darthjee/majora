import Badge from '../../../../common/badges/Badge.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Status badges of a staff copy source row.
 *
 * @description Shows an "already copied" badge when the row was copied into the target game
 *   before, and a "name taken" badge when the target game already has an entry with that name
 *   (factions only).
 * @param {object} props - Component props.
 * @param {{copied_to_target?: boolean, name_taken_in_target?: boolean}} props.row - The row.
 * @returns {React.ReactElement} Status badges.
 */
export default function StaffCopyRowStatus({ row }) {
  return (
    <div className="d-flex flex-wrap gap-1">
      <ConditionalComponent render={Boolean(row.copied_to_target)}>
        <Badge variant="info" text={Translator.t('staff_copies_page.copied_to_target')} />
      </ConditionalComponent>
      <ConditionalComponent render={Boolean(row.name_taken_in_target)}>
        <Badge variant="warning" text={Translator.t('staff_copies_page.entity_error.name_taken')} />
      </ConditionalComponent>
    </div>
  );
}
