import Translator from '../../../../../i18n/Translator.js';

/**
 * Progress of a running bulk job (issue #1474).
 *
 * @param {object} props - Component props.
 * @param {{total: number, done: number}|null} props.job - Running bulk job, or `null`.
 * @returns {React.ReactElement|null} Progress bar and label, or `null` when no job runs.
 */
export default function StaffPhotoBulkProgress({ job }) {
  if (!job) return null;

  const { done, total } = job;
  const percent = total > 0 ? Math.round((done / total) * 100) : 100;
  const label = Translator.t('staff_photos_page.bulk_progress')
    .replace('{{done}}', done)
    .replace('{{total}}', total);

  return (
    <div className="my-3" role="status">
      <p className="mb-1">{label}</p>
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
