import React, { useEffect, useMemo, useState } from 'react';
import GamePcsController from './controllers/GamePcsController.js';

/**
 * Render game PCs page.
 *
 * @returns {React.ReactElement} Game PCs page.
 */
export default function GamePcs() {
  const [pcs, setPcs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GamePcsController(setPcs, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) {
    return <div>Loading PCs...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <div>Game PCs ({pcs.length}) - page {pagination.page}</div>;
}
