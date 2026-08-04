import { useEffect, useMemo, useState } from 'react';
import DiskCacheCardController from './controllers/DiskCacheCardController.js';
import DiskCacheCardHelper from './helpers/DiskCacheCardHelper.jsx';

/**
 * Dashboard card showing the proxy's on-disk cache size, with no actions
 * and an automatic retry every 60s while the fetch keeps failing.
 *
 * @returns {React.ReactElement} The rendered disk-cache card.
 */
export default function DiskCacheCard() {
  const [size, setSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const controller = useMemo(
    () => new DiskCacheCardController(setSize, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  return DiskCacheCardHelper.render({ size, loading, error });
}
