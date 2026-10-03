import Translator from '../../../../../i18n/Translator.js';
import StaffPhotoSummaryGroup from './StaffPhotoSummaryGroup.jsx';

const PREFIX = 'staff_photos_page';

/**
 * Picks the outcomes with the given status.
 *
 * @param {object[]} outcomes - Every outcome.
 * @param {string} status - Status to keep.
 * @returns {object[]} The matching outcomes.
 */
const withStatus = (outcomes, status) => outcomes.filter((outcome) => outcome.status === status);

/**
 * Result summary of a finished bulk job (issue #1474).
 *
 * @description Groups the outcomes into resized / deleted (by action), skipped and failed, with
 *   the translated reason of each skipped / failed entry.
 * @param {object} props - Component props.
 * @param {{action: string, outcomes: object[]}|null} props.result - Finished bulk job, or
 *   `null`.
 * @param {Function} props.onClose - Called when the summary is closed.
 * @returns {React.ReactElement|null} Summary, or `null` when there is no result.
 */
export default function StaffPhotoBulkSummary({ result, onClose }) {
  if (!result) return null;

  const { action, outcomes } = result;
  const doneKey = action === 'delete' ? 'summary_deleted' : 'summary_resized';

  return (
    <div className="card my-3">
      <div className="card-body">
        <h2 className="h5 card-title">{Translator.t(`${PREFIX}.summary_title`)}</h2>
        <StaffPhotoSummaryGroup titleKey={`${PREFIX}.${doneKey}`} outcomes={withStatus(outcomes, 'done')} />
        <StaffPhotoSummaryGroup titleKey={`${PREFIX}.summary_skipped`} outcomes={withStatus(outcomes, 'skipped')} />
        <StaffPhotoSummaryGroup titleKey={`${PREFIX}.summary_failed`} outcomes={withStatus(outcomes, 'failed')} />
        <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
          {Translator.t(`${PREFIX}.summary_close`)}
        </button>
      </div>
    </div>
  );
}
