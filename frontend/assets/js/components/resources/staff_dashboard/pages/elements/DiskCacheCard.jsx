import { useEffect, useMemo, useState } from 'react';
import DiskCacheCardController from './controllers/DiskCacheCardController.js';
import DiskCacheCardHelper from './helpers/DiskCacheCardHelper.jsx';
import ClearCacheConfirmModal from './ClearCacheConfirmModal.jsx';

/**
 * Dashboard card showing the proxy's on-disk cache size, with "Clear Cache"
 * and "Refresh" actions, plus an automatic retry every 60s while the fetch
 * keeps failing.
 *
 * @returns {React.ReactElement} The rendered disk-cache card.
 */
export default function DiskCacheCard() {
  const [size, setSize] = useState(null);
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const controller = useMemo(
    () => new DiskCacheCardController(setSize, setStatus, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <>
      {DiskCacheCardHelper.render(
        { size, status, loading, error },
        {
          onClearCache: () => setShowConfirm(true),
          onRefresh: () => controller.refresh(),
        },
      )}
      <ClearCacheConfirmModal
        show={showConfirm}
        onConfirm={() => { setShowConfirm(false); controller.clearCache(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
