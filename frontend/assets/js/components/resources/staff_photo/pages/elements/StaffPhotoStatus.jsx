import Badge from '../../../../common/badges/Badge.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Status badges of a staff photo row.
 *
 * @description Always shows a ready / not-ready badge, plus a replace-in-progress badge while a
 *   replace is in flight.
 * @param {object} props - Component props.
 * @param {{ready: boolean, replace_in_progress: boolean}} props.photo - The photo row.
 * @returns {React.ReactElement} Status badges.
 */
export default function StaffPhotoStatus({ photo }) {
  const readyKey = photo.ready ? 'status_ready' : 'status_not_ready';

  return (
    <div className="d-flex flex-wrap gap-1">
      <Badge variant={photo.ready ? 'success' : 'secondary'} text={Translator.t(`staff_photos_page.${readyKey}`)} />
      <ConditionalComponent render={Boolean(photo.replace_in_progress)}>
        <Badge variant="warning" text={Translator.t('staff_photos_page.status_replace_in_progress')} />
      </ConditionalComponent>
    </div>
  );
}
