import { useEffect, useMemo, useState } from 'react';
import CrawlerDebugCardController from './controllers/CrawlerDebugCardController.js';
import CrawlerDebugCardHelper from './helpers/CrawlerDebugCardHelper.jsx';
import ClearCrawlerConfirmModal from './ClearCrawlerConfirmModal.jsx';

/**
 * Dashboard card showing the retained crawler debug emissions grouped by
 * model type, with "Clear entries" and "Refresh" actions.
 *
 * @returns {React.ReactElement} The rendered crawler debug card.
 */
export default function CrawlerDebugCard() {
  const [counts, setCounts] = useState(null);
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const controller = useMemo(
    () => new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <>
      {CrawlerDebugCardHelper.render(
        { counts, status, loading, error },
        {
          onClearCache: () => setShowConfirm(true),
          onRefresh: () => controller.refresh(),
        },
      )}
      <ClearCrawlerConfirmModal
        show={showConfirm}
        onConfirm={() => { setShowConfirm(false); controller.clearEmissions(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
