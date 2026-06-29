import { useEffect, useMemo, useState } from 'react';
import TreasuresController from './controllers/TreasuresController.js';
import TreasuresHelper from './helpers/TreasuresHelper.jsx';

/**
 * Render treasures index page.
 *
 * @returns {React.ReactElement} Treasures page.
 */
export default function Treasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new TreasuresController(setTreasures, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) {
    return TreasuresHelper.renderLoading();
  }

  if (error) {
    return TreasuresHelper.renderError(error);
  }

  return TreasuresHelper.render(treasures, pagination);
}
