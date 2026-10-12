import Translator from '../../../../../i18n/Translator.js';
import StaffCopyEntityResult from './StaffCopyEntityResult.jsx';

/**
 * Progress of the staff copy run (issue #1571).
 *
 * @description Shows the `{{done}} of {{total}} copied` counter with a progress bar, then the
 *   per-entity result list with its per-file statuses. Stays visible after the run finishes so
 *   the results can be reviewed.
 * @param {object} props - Component props.
 * @param {{total: number, done: number, entities: object[]}|null} props.run - Run snapshot, or
 *   `null` when no run has started.
 * @returns {React.ReactElement|null} Progress block, or `null` without a run.
 */
export default function StaffCopyProgress({ run }) {
  if (!run) return null;

  const { done, total } = run;
  const percent = total > 0 ? Math.round((done / total) * 100) : 100;
  const label = Translator.t('staff_copies_page.progress')
    .replace('{{done}}', done)
    .replace('{{total}}', total);

  return (
    <div className="my-3" role="status">
      <p className="mb-1">{label}</p>
      <div className="progress mb-2" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
      <ul className="list-group">
        {run.entities.map((entity) => <StaffCopyEntityResult key={entity.id} entity={entity} />)}
      </ul>
    </div>
  );
}
