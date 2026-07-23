import { useEffect, useMemo, useState } from 'react';
import MemoryCacheCardController from './controllers/MemoryCacheCardController.js';
import MemoryCacheCardHelper from './helpers/MemoryCacheCardHelper.jsx';

/**
 * Dashboard card showing the current server-side memory cache usage as a
 * percentage, with "Clear Cache" and "Refresh" actions.
 *
 * @returns {React.ReactElement} The rendered memory-cache card.
 */
export default function MemoryCacheCard() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const controller = useMemo(
    () => new MemoryCacheCardController(setSummary, setStatus, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  return MemoryCacheCardHelper.render(
    { summary, status, loading, error },
    {
      onClearCache: () => controller.clearCache(),
      onRefresh: () => controller.refresh(),
      onDataClick: () => controller.logData(summary),
    },
  );
}
