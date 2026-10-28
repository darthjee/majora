import { useEffect, useMemo, useState } from 'react';
import VisitsSummaryCardController from './controllers/VisitsSummaryCardController.js';
import VisitsSummaryCardHelper from './helpers/VisitsSummaryCardHelper.jsx';
import ClearStatisticsConfirmModal from './ClearStatisticsConfirmModal.jsx';

/**
 * Dashboard card showing the unique-visitors count for a day / week / month period, with
 * "Clear statistics" and "Refresh" actions (issue #1685).
 *
 * @returns {React.ReactElement} The rendered visits-summary card.
 */
export default function VisitsSummaryCard() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState('day');
  const [showConfirm, setShowConfirm] = useState(false);

  const controller = useMemo(
    () => new VisitsSummaryCardController(setSummary, setStatus, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <>
      {VisitsSummaryCardHelper.render(
        { summary, status, loading, error, period },
        {
          onPeriodChange: (event) => {
            setPeriod(event.target.value);
            controller.changePeriod(event.target.value);
          },
          onClear: () => setShowConfirm(true),
          onRefresh: () => controller.refresh(),
        },
      )}
      <ClearStatisticsConfirmModal
        show={showConfirm}
        onConfirm={() => { setShowConfirm(false); controller.clear(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
